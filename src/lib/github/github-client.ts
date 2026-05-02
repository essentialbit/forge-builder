/**
 * Forge Builder — GitHub API Client
 *
 * Wraps @octokit/rest to provide Forge Builder-specific operations:
 *   - Create repository for a new project
 *   - Connect existing repository to a project
 *   - Push content JSON (site data) to repo
 *   - Check connection status
 *
 * Auth: Personal Access Token (PAT) stored server-side in env vars.
 * OAuth App flow is handled separately via /api/auth/github.
 */

import { Octokit } from '@octokit/rest';

export interface GitHubConnectionStatus {
  connected: boolean;
  username?: string;
  repoFullName?: string;
  repoUrl?: string;
  defaultBranch?: string;
  error?: string;
}

export interface CreateRepoOptions {
  name: string;
  description?: string;
  isPrivate?: boolean;
  autoInit?: boolean;
}

export interface PushContentOptions {
  owner: string;
  repo: string;
  branch?: string;
  filePath?: string;
  content: Record<string, unknown>;
  commitMessage?: string;
}

// ── Factory ─────────────────────────────────────────────────────────────────

export function createGitHubClient(token: string): GitHubClient {
  return new GitHubClient(token);
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  /** Verify the token and return the authenticated user */
  async getAuthenticatedUser(): Promise<{ login: string; name: string | null; avatar_url: string } | null> {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return { login: data.login, name: data.name ?? null, avatar_url: data.avatar_url };
    } catch {
      return null;
    }
  }

  /** Check connection to a specific repo */
  async checkRepoConnection(fullName: string): Promise<GitHubConnectionStatus> {
    const [owner, repo] = fullName.split('/');
    if (!owner || !repo) {
      return { connected: false, error: 'Invalid repo format. Use "owner/repo".' };
    }
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      return {
        connected: true,
        repoFullName: data.full_name,
        repoUrl: data.html_url,
        defaultBranch: data.default_branch,
      };
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404) return { connected: false, error: 'Repository not found. Check the name and your permissions.' };
      if (status === 401) return { connected: false, error: 'Authentication failed. Update your GitHub token.' };
      return { connected: false, error: String(e) };
    }
  }

  /** Create a new repository */
  async createRepo(options: CreateRepoOptions): Promise<{ fullName: string; url: string; cloneUrl: string } | null> {
    try {
      const { data } = await this.octokit.repos.createForAuthenticatedUser({
        name: options.name,
        description: options.description ?? 'Created with Forge Builder',
        private: options.isPrivate ?? false,
        auto_init: options.autoInit ?? true,
      });
      return {
        fullName: data.full_name,
        url: data.html_url,
        cloneUrl: data.clone_url,
      };
    } catch (e) {
      const msg = (e as { message?: string }).message ?? String(e);
      if (msg.includes('already exists')) {
        throw new Error(`Repository "${options.name}" already exists. Choose a different name.`);
      }
      throw new Error(`Failed to create repository: ${msg}`);
    }
  }

  /** Push (upsert) a file to the repository */
  async pushFile(options: PushContentOptions): Promise<{ sha: string; url: string }> {
    const {
      owner, repo,
      branch = 'main',
      filePath = 'forge-content.json',
      content,
      commitMessage = 'Update Forge Builder content',
    } = options;

    const contentBase64 = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    // Get existing file SHA if it exists (required for update)
    let existingSha: string | undefined;
    try {
      const { data } = await this.octokit.repos.getContent({ owner, repo, path: filePath, ref: branch });
      if (!Array.isArray(data) && data.type === 'file') {
        existingSha = data.sha;
      }
    } catch { /* file doesn't exist yet — that's fine */ }

    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner, repo,
      path: filePath,
      message: commitMessage,
      content: contentBase64,
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    });

    return {
      sha: data.content?.sha ?? '',
      url: data.content?.html_url ?? '',
    };
  }

  /** List the user's repositories (for the connect wizard) */
  async listRepos(type: 'all' | 'public' | 'private' = 'all'): Promise<Array<{
    fullName: string;
    description: string | null;
    isPrivate: boolean;
    updatedAt: string | null;
    url: string;
  }>> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      type,
      sort: 'updated',
      per_page: 50,
    });
    return data.map((r) => ({
      fullName: r.full_name,
      description: r.description,
      isPrivate: r.private,
      updatedAt: r.updated_at ?? null,
      url: r.html_url,
    }));
  }

  /** Create a GitHub Actions workflow for Netlify deployment */
  async createNetlifyWorkflow(owner: string, repo: string, netlifySiteId: string): Promise<void> {
    const workflow = `name: Deploy to Netlify
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: '.'
          production-branch: main
          github-token: \${{ secrets.GITHUB_TOKEN }}
          deploy-message: 'Deploy from GitHub Actions'
        env:
          NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${netlifySiteId}
`;
    const contentBase64 = Buffer.from(workflow).toString('base64');

    try {
      await this.octokit.repos.createOrUpdateFileContents({
        owner, repo,
        path: '.github/workflows/deploy.yml',
        message: 'Add Netlify deployment workflow',
        content: contentBase64,
        branch: 'main',
      });
    } catch { /* non-critical — user can add manually */ }
  }
}

/** Server-side factory using environment token */
export function getServerGitHubClient(): GitHubClient | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return new GitHubClient(token);
}
