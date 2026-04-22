/**
 * GitHub sync \u2014 pushes the rendered static site to a repo.
 *
 * Uses shell git via execa-style spawn since we expect git + the PAT on
 * the dev machine. Repo is cloned/pulled into `.forge-publish/<repo>/`
 * under the project dir on first run, then reused.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

export interface GithubSyncParams {
  token: string;
  user: string; // token owner username, used for https auth
  repo: string; // "owner/repo"
  branch?: string; // default "main"
  workDir: string; // where to clone (stable per project)
  files: Array<{ path: string; content: string }>;
  commitMessage: string;
}

export interface GithubSyncResult {
  pushed: boolean;
  sha?: string;
  repo?: string;
  branch?: string;
  error?: string;
  logs: Array<{ t: number; level: 'info' | 'warn' | 'error'; msg: string }>;
}

function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

export async function syncToGithub(params: GithubSyncParams): Promise<GithubSyncResult> {
  const { token, user, repo, branch = 'main', workDir, files, commitMessage } = params;
  const logs: GithubSyncResult['logs'] = [];
  const log = (level: 'info' | 'warn' | 'error', msg: string) => {
    logs.push({ t: Date.now(), level, msg });
  };

  try {
    if (!token) throw new Error('Missing GITHUB_TOKEN');
    if (!repo || !repo.includes('/')) throw new Error(`Invalid repo "${repo}" \u2014 expected "owner/repo"`);

    const remoteUrl = `https://${user || 'x-access-token'}:${token}@github.com/${repo}.git`;
    const cloneDir = path.join(workDir, repo.replace('/', '__'));

    // Ensure clone exists and is on the right branch
    const exists = await fs
      .access(path.join(cloneDir, '.git'))
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      log('info', `Cloning ${repo} into ${cloneDir}\u2026`);
      await fs.mkdir(workDir, { recursive: true });
      const clone = await run('git', ['clone', '--depth', '1', '--branch', branch, remoteUrl, cloneDir]);
      if (clone.code !== 0) {
        // If branch doesn't exist, try fresh init
        log('warn', `git clone failed (code ${clone.code}): ${clone.stderr.slice(0, 300)}`);
        log('info', 'Attempting fresh init + push to new branch\u2026');
        await fs.mkdir(cloneDir, { recursive: true });
        await run('git', ['init', '-b', branch], { cwd: cloneDir });
        await run('git', ['remote', 'add', 'origin', remoteUrl], { cwd: cloneDir });
      }
    } else {
      log('info', `Reusing existing clone at ${cloneDir}`);
      // Fetch + reset
      await run('git', ['fetch', 'origin', branch], { cwd: cloneDir });
      await run('git', ['checkout', branch], { cwd: cloneDir });
      const pull = await run('git', ['reset', '--hard', `origin/${branch}`], { cwd: cloneDir });
      if (pull.code !== 0) log('warn', `git reset warn: ${pull.stderr.slice(0, 200)}`);
    }

    // Write files
    // Clear out non-.git contents first so deletions propagate
    const entries = await fs.readdir(cloneDir);
    for (const e of entries) {
      if (e === '.git') continue;
      await fs.rm(path.join(cloneDir, e), { recursive: true, force: true });
    }
    for (const f of files) {
      const filePath = path.join(cloneDir, f.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, f.content, 'utf8');
    }
    log('info', `Wrote ${files.length} files to worktree.`);

    // Configure identity (first run) \u2014 use a bot persona
    await run('git', ['config', 'user.email', 'jamesbro@openclaw.ai'], { cwd: cloneDir });
    await run('git', ['config', 'user.name', 'Forge Builder'], { cwd: cloneDir });

    // Commit
    const add = await run('git', ['add', '-A'], { cwd: cloneDir });
    if (add.code !== 0) throw new Error(`git add failed: ${add.stderr}`);

    const status = await run('git', ['status', '--porcelain'], { cwd: cloneDir });
    if (!status.stdout.trim()) {
      log('info', 'No changes to commit \u2014 skipping push.');
      const head = await run('git', ['rev-parse', 'HEAD'], { cwd: cloneDir });
      return {
        pushed: true,
        sha: head.stdout.trim(),
        repo,
        branch,
        logs,
      };
    }

    const commit = await run('git', ['commit', '-m', commitMessage], { cwd: cloneDir });
    if (commit.code !== 0) throw new Error(`git commit failed: ${commit.stderr}`);
    log('info', `Committed: ${commit.stdout.split('\\n')[0] || '(no output)'}`);

    const push = await run('git', ['push', 'origin', branch], { cwd: cloneDir });
    if (push.code !== 0) {
      // Try with --set-upstream for new branches
      const upstream = await run('git', ['push', '--set-upstream', 'origin', branch], { cwd: cloneDir });
      if (upstream.code !== 0) {
        const stderr = upstream.stderr || push.stderr;
        if (/403|Permission .* denied|unable to access/.test(stderr)) {
          throw new Error(
            `GitHub push denied (403). The PAT does not have write access to ${repo}. ` +
              `Fix: in GitHub → Settings → Developer settings → Personal access tokens (fine-grained), ` +
              `add "${repo}" to the token's Repository access and grant Contents: Read and write. ` +
              `Alternatively, push to a repo already in the token's allowlist.`,
          );
        }
        throw new Error(`git push failed: ${stderr.slice(0, 400)}`);
      }
    }
    log('info', `Pushed to ${repo}@${branch}`);

    const head = await run('git', ['rev-parse', 'HEAD'], { cwd: cloneDir });
    return {
      pushed: true,
      sha: head.stdout.trim(),
      repo,
      branch,
      logs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log('error', msg);
    return { pushed: false, error: msg, logs };
  }
}
