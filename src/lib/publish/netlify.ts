/**
 * Netlify direct-deploy via digest/upload API.
 * Docs: https://docs.netlify.com/api/get-started/#file-digest-method
 *
 * Flow:
 *  1. Build a digest map { "/index.html": "sha1", ... }
 *  2. POST /sites/:site_id/deploys with { files: digestMap }
 *  3. Netlify returns required_files (SHAs we still need to upload)
 *  4. PUT each required file to /deploys/:deploy_id/files/:path
 *  5. Poll deploy until state == "ready" (or error)
 */

import crypto from 'node:crypto';

const NETLIFY_API = 'https://api.netlify.com/api/v1';

export interface NetlifyDeployFile {
  path: string; // must start with /
  content: string;
}

export interface NetlifyDeployResult {
  deployed: boolean;
  deployId?: string;
  url?: string;
  state?: string;
  error?: string;
  logs: Array<{ t: number; level: 'info' | 'warn' | 'error'; msg: string }>;
}

function sha1(content: string | Buffer): string {
  const hash = crypto.createHash('sha1');
  hash.update(content);
  return hash.digest('hex');
}

function normalizePath(p: string): string {
  return '/' + p.replace(/^\/+/, '');
}

async function api(
  token: string,
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
  contentType = 'application/json',
): Promise<Response> {
  const isBuffer = body instanceof Buffer;
  return fetch(NETLIFY_API + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && !isBuffer ? { 'Content-Type': 'application/json' } : {}),
      ...(isBuffer ? { 'Content-Type': contentType } : {}),
    },
    body: body == null ? undefined : isBuffer ? (body as unknown as BodyInit) : JSON.stringify(body),
  });
}

export async function deployToNetlify(params: {
  token: string;
  siteId: string;
  files: NetlifyDeployFile[];
  timeoutMs?: number;
}): Promise<NetlifyDeployResult> {
  const { token, siteId, files, timeoutMs = 120_000 } = params;
  const logs: NetlifyDeployResult['logs'] = [];
  const log = (level: 'info' | 'warn' | 'error', msg: string) => {
    logs.push({ t: Date.now(), level, msg });
  };

  try {
    if (!token) throw new Error('Missing NETLIFY_TOKEN');
    if (!siteId) throw new Error('Missing Netlify site id');

    // Build digest
    const digest: Record<string, string> = {};
    const contentBySha = new Map<string, Buffer>();
    for (const f of files) {
      const buf = Buffer.from(f.content, 'utf8');
      const s = sha1(buf);
      digest[normalizePath(f.path)] = s;
      contentBySha.set(s, buf);
    }

    log('info', `Prepared ${files.length} files for Netlify deploy.`);

    // Create deploy
    const createRes = await api(token, 'POST', `/sites/${siteId}/deploys`, {
      files: digest,
      async: false,
    });
    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Netlify create deploy ${createRes.status}: ${errText.slice(0, 300)}`);
    }
    const deploy = await createRes.json();
    const deployId: string = deploy.id;
    const required: string[] = deploy.required ?? [];
    log('info', `Netlify deploy created: ${deployId}. Need to upload ${required.length} files.`);

    // Upload required files
    for (const sha of required) {
      const buf = contentBySha.get(sha);
      if (!buf) {
        throw new Error(`Missing content for sha ${sha}`);
      }
      // Find the path for this sha
      const entry = Object.entries(digest).find(([, s]) => s === sha);
      const pathForSha = entry?.[0] ?? '/';
      const uploadRes = await api(
        token,
        'PUT',
        `/deploys/${deployId}/files${pathForSha}`,
        buf,
        'application/octet-stream',
      );
      if (!uploadRes.ok) {
        const t = await uploadRes.text();
        throw new Error(`Upload failed for ${pathForSha}: ${uploadRes.status} ${t.slice(0, 200)}`);
      }
    }
    log('info', `Uploaded ${required.length} files.`);

    // Poll deploy state
    const start = Date.now();
    let state = deploy.state as string;
    let deployUrl: string | undefined = deploy.ssl_url || deploy.deploy_ssl_url || deploy.url || deploy.deploy_url;
    let lastErr: string | undefined;

    while (Date.now() - start < timeoutMs) {
      const statusRes = await api(token, 'GET', `/sites/${siteId}/deploys/${deployId}`);
      if (!statusRes.ok) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      const status = await statusRes.json();
      state = status.state;
      deployUrl = status.ssl_url || status.deploy_ssl_url || status.url || status.deploy_url || deployUrl;
      lastErr = status.error_message;
      if (state === 'ready') {
        log('info', `Netlify deploy ready at ${deployUrl}`);
        return { deployed: true, deployId, url: deployUrl, state, logs };
      }
      if (state === 'error' || state === 'rejected') {
        throw new Error(`Netlify deploy ${state}: ${lastErr ?? 'unknown error'}`);
      }
      await new Promise((r) => setTimeout(r, 2500));
    }

    log('warn', `Deploy timed out in state=${state}; returning partial result.`);
    return { deployed: true, deployId, url: deployUrl, state, logs };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log('error', msg);
    return { deployed: false, error: msg, logs };
  }
}
