import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { getProject } from '@/lib/projects';

function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const c = spawn(cmd, args, { cwd });
    let stdout = '';
    let stderr = '';
    c.stdout.on('data', (d) => (stdout += d));
    c.stderr.on('data', (d) => (stderr += d));
    c.on('close', (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

/**
 * List git commits from the publish worktree for this project.
 * Each commit is a previous publish.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const cfg = (project as unknown as Record<string, { githubRepo?: string }>).deployConfig;
    const repo = cfg?.githubRepo;
    if (!repo) return NextResponse.json({ revisions: [], configured: false });

    const workDir = path.join(process.cwd(), 'projects', id, '.forge-publish', repo.replace('/', '__'));
    try {
      await fs.access(workDir);
    } catch {
      return NextResponse.json({ revisions: [], configured: true, noHistory: true });
    }

    const log = await run('git', ['log', '--pretty=format:%H|%an|%ae|%at|%s', '-n', '25'], workDir);
    if (log.code !== 0) {
      return NextResponse.json({ revisions: [], error: log.stderr.slice(0, 200) });
    }
    const revisions = log.stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [sha, authorName, authorEmail, ts, ...rest] = line.split('|');
        return {
          sha,
          authorName,
          authorEmail,
          timestamp: Number(ts) * 1000,
          message: rest.join('|'),
        };
      });

    const head = await run('git', ['rev-parse', 'HEAD'], workDir);

    return NextResponse.json({
      revisions,
      configured: true,
      currentSha: head.stdout.trim(),
      repo,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
