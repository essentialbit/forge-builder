/**
 * POST /api/github/connect
 * Validates a GitHub PAT + repo and stores it in the project deploy config.
 *
 * POST /api/github/repos
 * Lists repos for the authenticated token.
 *
 * POST /api/github/create-repo
 * Creates a new GitHub repo for a project.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github/github-client';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action: 'check' | 'list-repos' | 'create-repo';
      token: string;
      repoFullName?: string;
      repoName?: string;
      description?: string;
      isPrivate?: boolean;
      netlifySiteId?: string;
    };

    if (!body.token) {
      return NextResponse.json({ error: 'GitHub token required' }, { status: 400 });
    }

    const client = createGitHubClient(body.token);
    const user = await client.getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Invalid GitHub token — authentication failed' }, { status: 401 });
    }

    switch (body.action) {
      case 'check': {
        if (!body.repoFullName) {
          return NextResponse.json({ user, repos: null });
        }
        const status = await client.checkRepoConnection(body.repoFullName);
        return NextResponse.json({ user, ...status });
      }

      case 'list-repos': {
        const repos = await client.listRepos('all');
        return NextResponse.json({ user, repos });
      }

      case 'create-repo': {
        if (!body.repoName) {
          return NextResponse.json({ error: 'repoName required' }, { status: 400 });
        }
        const slugName = body.repoName
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        const result = await client.createRepo({
          name: slugName,
          description: body.description ?? 'My Forge Builder site',
          isPrivate: body.isPrivate ?? false,
          autoInit: true,
        });

        // Optionally add Netlify workflow
        if (result && body.netlifySiteId) {
          const [owner, repo] = result.fullName.split('/');
          await client.createNetlifyWorkflow(owner, repo, body.netlifySiteId);
        }

        return NextResponse.json({ user, repo: result });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e) {
    console.error('[github/connect]', e);
    return NextResponse.json({ error: (e as Error).message ?? String(e) }, { status: 500 });
  }
}
