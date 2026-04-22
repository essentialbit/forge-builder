import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getProject, saveProject, getSections } from '@/lib/projects';
import { renderSite } from '@/lib/publish/renderer';
import { deployToNetlify } from '@/lib/publish/netlify';
import { syncToGithub } from '@/lib/publish/github';
import type { Section } from '@/types/builder';

interface DeployConfig {
  githubRepo?: string;
  githubBranch?: string;
  netlifySiteId?: string;
  customDomain?: string;
}

type LogEntry = { t: number; level: 'info' | 'warn' | 'error'; msg: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const started = Date.now();
  const logs: LogEntry[] = [];
  const log = (level: LogEntry['level'], msg: string) => logs.push({ t: Date.now(), level, msg });

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const deployConfig: DeployConfig = body?.deployConfig ?? {};

    // 1) Load project + sections
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found', logs }, { status: 404 });
    }
    const sections = await getSections(id);
    const sectionMap = new Map<string, Section>(sections.map((s) => [s.id, s] as const));
    log('info', `Loaded project "${project.name}" with ${sections.length} sections.`);

    // 2) Render static site
    const rendered = renderSite(project, sectionMap);
    log('info', `Rendered ${rendered.files.length} files.`);

    // 3) Write export to disk (local preview of the published artefact)
    const exportDir = path.join(process.cwd(), 'projects', id, 'export');
    await fs.rm(exportDir, { recursive: true, force: true });
    await fs.mkdir(exportDir, { recursive: true });
    for (const f of rendered.files) {
      const dest = path.join(exportDir, f.path);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, f.content, 'utf8');
    }
    log('info', `Wrote export to ${exportDir}`);

    // 4) Optional: sync to GitHub
    let githubResult: Awaited<ReturnType<typeof syncToGithub>> | null = null;
    if (deployConfig.githubRepo) {
      log('info', `Syncing to GitHub repo ${deployConfig.githubRepo}\u2026`);
      const token = process.env.GITHUB_TOKEN;
      const user = process.env.GITHUB_USER || 'x-access-token';
      if (!token) {
        log('error', 'GITHUB_TOKEN not set in environment.');
        githubResult = {
          pushed: false,
          error: 'GITHUB_TOKEN missing on server. Set it in .env.local.',
          logs: [],
        };
      } else {
        githubResult = await syncToGithub({
          token,
          user,
          repo: deployConfig.githubRepo,
          branch: deployConfig.githubBranch || 'main',
          workDir: path.join(process.cwd(), 'projects', id, '.forge-publish'),
          files: rendered.files,
          commitMessage: `forge-builder: publish ${project.name} \u2014 ${new Date().toISOString()}`,
        });
        githubResult.logs.forEach((l) => logs.push(l));
        if (!githubResult.pushed) {
          log('warn', `GitHub sync failed: ${githubResult.error ?? 'unknown'}`);
        }
      }
    } else {
      log('info', 'No githubRepo configured \u2014 skipping GitHub sync.');
    }

    // 5) Optional: Netlify direct deploy
    let netlifyResult: Awaited<ReturnType<typeof deployToNetlify>> | null = null;
    if (deployConfig.netlifySiteId) {
      log('info', `Deploying to Netlify site ${deployConfig.netlifySiteId}\u2026`);
      const token = process.env.NETLIFY_TOKEN;
      if (!token) {
        log('error', 'NETLIFY_TOKEN not set in environment.');
        netlifyResult = {
          deployed: false,
          error: 'NETLIFY_TOKEN missing on server. Set it in .env.local.',
          logs: [],
        };
      } else {
        netlifyResult = await deployToNetlify({
          token,
          siteId: deployConfig.netlifySiteId,
          files: rendered.files.map((f) => ({ path: '/' + f.path, content: f.content })),
        });
        netlifyResult.logs.forEach((l) => logs.push(l));
        if (!netlifyResult.deployed) {
          log('warn', `Netlify deploy failed: ${netlifyResult.error ?? 'unknown'}`);
        }
      }
    } else {
      log('info', 'No netlifySiteId configured \u2014 skipping Netlify deploy.');
    }

    // 6) Persist status + last publish summary
    project.status = 'published';
    project.updated = new Date().toISOString();
    const lastPublish = {
      at: new Date().toISOString(),
      durationMs: Date.now() - started,
      github: githubResult,
      netlify: netlifyResult,
      localUrl: `/api/projects/${id}/exported/index.html`,
    };
    (project as unknown as Record<string, unknown>).lastPublish = lastPublish;
    (project as unknown as Record<string, unknown>).deployConfig = deployConfig;
    await saveProject(project);

    log('info', `Publish complete in ${Date.now() - started}ms.`);

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - started,
      exportDir,
      localUrl: lastPublish.localUrl,
      github: githubResult,
      netlify: netlifyResult,
      logs,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log('error', msg);
    return NextResponse.json(
      { error: msg, logs, durationMs: Date.now() - started },
      { status: 500 },
    );
  }
}
