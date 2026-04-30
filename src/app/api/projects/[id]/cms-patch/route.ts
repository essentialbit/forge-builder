/**
 * POST /api/projects/[id]/cms-patch
 *
 * CMS Patch Mode — push ONLY the editable content JSON to the target GitHub repo.
 * Does NOT overwrite the entire repo. Safe for React apps where the build is
 * managed by Netlify CI rather than Forge Builder.
 *
 * Pushes:  public/forge-cms/forge-content.json
 *
 * The Forge Jewellery React app reads this file at runtime:
 *   fetch('/forge-cms/forge-content.json').then(r => r.json())
 *
 * Returns: { success: true, sha: string, url: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/projects';
import type { Project } from '@/types/builder';

// ── CMS content shape ─────────────────────────────────────────────────────────

interface CmsSection {
  type: string;
  settings: Record<string, unknown>;
}

interface CmsContent {
  version: number;
  updatedAt: string;
  projectName: string;
  pages: Record<string, { slug: string; title: string; sections: CmsSection[] }>;
  global: {
    theme: { primaryColor: string; fontFamily: string };
    announcement?: { text: string; link: string; backgroundColor: string; textColor: string };
    promoBanner?: Record<string, unknown>;
    savingsStrip?: Record<string, unknown>;
    badgeSettings?: Record<string, unknown>;
    categoryHeroes?: Record<string, unknown>;
    moissaniteShowcase?: Record<string, unknown>;
  };
}

// ── Helper: scan all sections across all pages for a given type ───────────────

function findFirstSection(
  project: Project,
  type: string,
): Record<string, unknown> | undefined {
  for (const page of project.pages) {
    for (const sectionId of page.sections ?? []) {
      const section = project.sections?.[sectionId];
      if (section?.type === type) {
        return section.settings as Record<string, unknown>;
      }
    }
  }
  return undefined;
}

// ── Extract CMS payload from project ─────────────────────────────────────────

function buildCmsContent(project: Project): CmsContent {
  const pages: CmsContent['pages'] = {};

  for (const page of project.pages) {
    const sections: CmsSection[] = (page.sections ?? [])
      .flatMap((sectionId) => {
        const section = project.sections?.[sectionId];
        if (!section) return [];
        const entry: CmsSection = { type: section.type as string, settings: (section.settings ?? {}) as Record<string, unknown> };
        return [entry];
      });

    pages[page.slug] = { slug: page.slug, title: page.name, sections };
  }

  // ── Pull global settings from known section types ─────────────────────────

  // Announcement bar
  let announcement: CmsContent['global']['announcement'] | undefined;
  const announcementSettings = findFirstSection(project, 'announcement');
  if (announcementSettings) {
    announcement = {
      text: String(announcementSettings.text ?? ''),
      link: String(announcementSettings.link ?? ''),
      backgroundColor: String(announcementSettings.background_color ?? '#D4AF37'),
      textColor: String(announcementSettings.text_color ?? '#000000'),
    };
  }

  // Promo banner (full settings object — React app reads the keys it needs)
  const promoBanner = findFirstSection(project, 'promo-banner');

  // Savings strip items + display config
  const savingsStrip = findFirstSection(project, 'savings-strip');

  // Product badge settings (GRA callout, savings % threshold, badge labels)
  const badgeSettings = findFirstSection(project, 'product-badge-settings');

  // Category hero copy (title, subtitle, image per category)
  const categoryHeroes = findFirstSection(project, 'category-copy-editor');

  // Moissanite showcase copy (GRA strip text, diamond comparison text)
  const moissaniteShowcase = findFirstSection(project, 'moissanite-showcase');

  return {
    version: Date.now(),
    updatedAt: new Date().toISOString(),
    projectName: project.name,
    pages,
    global: {
      theme: {
        primaryColor: project.theme?.primaryColor ?? '#C5A059',
        fontFamily: project.theme?.fontFamily ?? 'inter',
      },
      ...(announcement ? { announcement } : {}),
      ...(promoBanner ? { promoBanner } : {}),
      ...(savingsStrip ? { savingsStrip } : {}),
      ...(badgeSettings ? { badgeSettings } : {}),
      ...(categoryHeroes ? { categoryHeroes } : {}),
      ...(moissaniteShowcase ? { moissaniteShowcase } : {}),
    },
  };
}

// ── GitHub file push helper ───────────────────────────────────────────────────

async function pushFileToGithub({
  token,
  repo,
  branch,
  filePath,
  content,
  commitMessage,
}: {
  token: string;
  repo: string;
  branch: string;
  filePath: string;
  content: string;
  commitMessage: string;
}): Promise<{ sha: string; url: string }> {
  const apiBase = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Check if file already exists to get its SHA (required for update)
  let existingSha: string | undefined;
  const getResp = await fetch(`${apiBase}?ref=${branch}`, { headers });
  if (getResp.ok) {
    const existing = await getResp.json() as { sha: string };
    existingSha = existing.sha;
  }

  const body: Record<string, string> = {
    message: commitMessage,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch,
  };
  if (existingSha) body.sha = existingSha;

  const putResp = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!putResp.ok) {
    const err = await putResp.json().catch(() => ({})) as { message?: string };
    throw new Error(`GitHub API error: ${err.message ?? putResp.statusText}`);
  }

  const result = await putResp.json() as { content: { sha: string; html_url: string } };
  return {
    sha: result.content.sha,
    url: result.content.html_url,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

interface DeployConfig {
  githubRepo?: string;
  githubBranch?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({})) as { deployConfig?: DeployConfig };
    const deployConfig: DeployConfig = body?.deployConfig ?? {};

    // Load project
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Build the CMS JSON
    const cmsContent = buildCmsContent(project);
    const cmsJson = JSON.stringify(cmsContent, null, 2);

    // Push to GitHub
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json({
        error: 'GITHUB_TOKEN not configured on the server. Add it to .env.local.',
      }, { status: 500 });
    }

    const repo = deployConfig.githubRepo;
    if (!repo) {
      return NextResponse.json({
        error: 'No GitHub repo configured for this project. Set it in Publish Settings.',
      }, { status: 400 });
    }

    const branch = deployConfig.githubBranch || 'main';
    const filePath = 'public/forge-cms/forge-content.json';

    const { sha, url } = await pushFileToGithub({
      token,
      repo,
      branch,
      filePath,
      content: cmsJson,
      commitMessage: `forge-builder: content update — ${new Date().toISOString()}`,
    });

    return NextResponse.json({
      success: true,
      sha,
      url,
      repo,
      branch,
      filePath,
      updatedAt: cmsContent.updatedAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
