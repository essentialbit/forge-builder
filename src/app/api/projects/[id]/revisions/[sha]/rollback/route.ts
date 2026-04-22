import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { getProject } from '@/lib/projects';
import { deployToNetlify } from '@/lib/publish/netlify';

function run(cmd: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const c = spawn(cmd, args, { cwd, env: { ...process.env, ...env } });
    let stdout = '';
    let stderr = '';
    c.stdout.on('data', (d) => (stdout += d));
    c.stderr.on('data', (d) => (stderr += d));
    c.on('close', (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

/**
 * Roll back the published site to a previous commit SHA:
 *  1. git checkout <sha> in the publish worktree
 *  2. Read all files at that revision
 *  3. Redeploy to Netlify (without pushing — keeps main untouched)
 *
 * This gives a quick "restore old version" without rewriting history.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sha: string }> },
) {
  try {
    const { id, sha } = await params;
    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const cfg =
      ((project as unknown as Record<string, { githubRepo?: string; netlifySiteId?: string; githubBranch?: string }>).deployConfig) ?? {};
    if (!cfg.githubRepo) return NextResponse.json({ error: 'No GitHub repo configured' }, { status: 400 });
    if (!cfg.netlifySiteId) return NextResponse.json({ error: 'No Netlify site configured' }, { status: 400 });

    const workDir = path.join(process.cwd(), 'projects', id, '.forge-publish', cfg.githubRepo.replace('/', '__'));

    // Safety: validate sha format
    if (!/^[a-f0-9]{7,40}$/i.test(sha)) {
      return NextResponse.json({ error: 'Invalid SHA' }, { status: 400 });
    }

    // Checkout the target revision
    const co = await run('git', ['checkout', '-f', sha], workDir);
    if (co.code !== 0) {
      return NextResponse.json({ error: `checkout failed: ${co.stderr.slice(0, 300)}` }, { status: 500 });
    }

    // Walk worktree files
    async function walk(dir: string, prefix = ''): Promise<Array<{ path: string; content: string }>> {
      const out: Array<{ path: string; content: string }> = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name === '.git') continue;
        const full = path.join(dir, e.name);
        const rel = prefix ? `${prefix}/${e.name}` : e.name;
        if (e.isDirectory()) {
          out.push(...(await walk(full, rel)));
        } else {
          out.push({ path: rel, content: await fs.readFile(full, 'utf8') });
        }
      }
      return out;
    }
    const files = await walk(workDir);

    // Redeploy to Netlify from the historical files
    const token = process.env.NETLIFY_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'NETLIFY_TOKEN missing' }, { status: 500 });
    }
    const result = await deployToNetlify({
      token,
      siteId: cfg.netlifySiteId,
      files: files.map((f) => ({ path: '/' + f.path, content: f.content })),
    });

    // Restore working tree to latest branch HEAD so next publish isn't confused
    await run('git', ['checkout', '-f', (cfg.githubBranch as string) || 'main'], workDir);

    return NextResponse.json({
      ok: result.deployed,
      rolledBackTo: sha,
      netlify: result,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
