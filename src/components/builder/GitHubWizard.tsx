"use client";

/**
 * Forge Builder — GitHub Connection Wizard
 *
 * Guides users through:
 *   Step 1: Enter / paste a GitHub Personal Access Token
 *   Step 2: Create a new repo OR connect an existing one
 *   Step 3: Confirm connection and save to deploy config
 *
 * For users without GitHub accounts, we show direct links to sign up.
 */

import { useState } from "react";
import {
  Github, CheckCircle, AlertCircle, Loader2,
  Plus, Link2, ExternalLink, Eye, EyeOff, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/lib/builder-store";

type Step = "token" | "repo" | "done";
type RepoMode = "create" | "connect";

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

interface RepoResult {
  fullName: string;
  url: string;
  cloneUrl?: string;
}

interface ConnectPayload {
  action: string;
  token: string;
  repoFullName?: string;
  repoName?: string;
  description?: string;
  isPrivate?: boolean;
  netlifySiteId?: string;
}

interface ConnectResponse {
  user?: GitHubUser;
  connected?: boolean;
  repoFullName?: string;
  repoUrl?: string;
  defaultBranch?: string;
  repos?: Array<{ fullName: string; description: string | null; updatedAt: string | null }>;
  repo?: RepoResult;
  error?: string;
}

async function callGitHubAPI(payload: ConnectPayload): Promise<ConnectResponse> {
  const res = await fetch('/api/github/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<ConnectResponse>;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GitHubWizard({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>("token");
  const [repoMode, setRepoMode] = useState<RepoMode>("create");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<ConnectResponse["repos"]>([]);
  const [newRepoName, setNewRepoName] = useState("");
  const [connectRepoName, setConnectRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedRepo, setConnectedRepo] = useState<string | null>(null);

  const { project, setDeployConfig } = useBuilderStore((s) => ({
    project: s.project,
    setDeployConfig: s.setDeployConfig,
  }));

  const reset = () => {
    setStep("token"); setToken(""); setUser(null);
    setError(null); setConnectedRepo(null);
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Step 1: Validate token ─────────────────────────────────────────────

  const validateToken = async () => {
    if (!token.trim()) return;
    setLoading(true); setError(null);
    try {
      const data = await callGitHubAPI({ action: 'list-repos', token });
      if (data.error) { setError(data.error); return; }
      setUser(data.user ?? null);
      setRepos(data.repos ?? []);
      // Pre-fill repo name from project
      if (project?.name) {
        setNewRepoName(project.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
      }
      setStep("repo");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2a: Create new repo ───────────────────────────────────────────

  const createRepo = async () => {
    if (!newRepoName.trim()) return;
    setLoading(true); setError(null);
    try {
      const data = await callGitHubAPI({
        action: 'create-repo', token,
        repoName: newRepoName, isPrivate,
        description: `${project?.name ?? 'My Site'} — built with Forge Builder`,
      });
      if (data.error) { setError(data.error); return; }
      const full = data.repo?.fullName ?? '';
      await saveConnection(full);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2b: Connect existing repo ────────────────────────────────────

  const connectRepo = async () => {
    if (!connectRepoName.trim()) return;
    setLoading(true); setError(null);
    try {
      const data = await callGitHubAPI({
        action: 'check', token,
        repoFullName: connectRepoName,
      });
      if (data.error || !data.connected) {
        setError(data.error ?? 'Repository not found');
        return;
      }
      await saveConnection(data.repoFullName ?? connectRepoName);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const saveConnection = async (fullName: string) => {
    await setDeployConfig({ githubRepo: fullName });
    setConnectedRepo(fullName);
    setStep("done");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
          <Github className="w-5 h-5 text-white" />
          <h2 className="text-base font-semibold text-white">Connect GitHub Repository</h2>
        </div>

        <div className="p-6 space-y-5">

          {/* ── Step: Token ── */}
          {step === "token" && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 rounded-xl p-4 space-y-2 border border-slate-700/50">
                <p className="text-sm font-medium text-slate-200">Why connect GitHub?</p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>Version control — every publish creates a commit</li>
                  <li>Continuous deployment via Netlify or Vercel</li>
                  <li>Collaborate with your team</li>
                  <li>Roll back to any previous version instantly</li>
                </ul>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">
                  Don&apos;t have a GitHub account?{" "}
                  <a href="https://github.com/signup" target="_blank" rel="noopener noreferrer"
                     className="text-amber-400 hover:text-amber-300 underline">
                    Create one free →
                  </a>
                </p>
                <a
                  href="https://github.com/settings/tokens/new?description=ForgeBuilder&scopes=repo,workflow"
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Generate a Personal Access Token (repo + workflow scopes)
                </a>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Personal Access Token (classic)</label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && validateToken()}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-600 pr-10"
                  />
                  <button
                    onClick={() => setShowToken((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-1">Token is used only to authenticate with GitHub and is never stored on our servers.</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg p-2.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Step: Repo ── */}
          {step === "repo" && user && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-white">{user.name ?? user.login}</p>
                  <p className="text-xs text-slate-500">@{user.login} · {repos?.length ?? 0} repos</p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
              </div>

              <div className="flex gap-2">
                {(["create", "connect"] as RepoMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRepoMode(mode)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition-all",
                      repoMode === mode
                        ? "bg-amber-700/30 border-amber-600 text-amber-300"
                        : "bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                    )}
                  >
                    {mode === "create" ? <Plus className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                    {mode === "create" ? "Create new repo" : "Connect existing"}
                  </button>
                ))}
              </div>

              {repoMode === "create" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Repository name</label>
                    <input
                      type="text"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      placeholder="my-jewellery-site"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-600"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">
                      Will be created at: github.com/{user.login}/{newRepoName || "…"}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded"
                    />
                    Make repository private
                  </label>
                </div>
              )}

              {repoMode === "connect" && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Repository (owner/repo)</label>
                  <input
                    type="text"
                    value={connectRepoName}
                    onChange={(e) => setConnectRepoName(e.target.value)}
                    placeholder={`${user.login}/my-site`}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-600"
                  />
                  {repos && repos.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                      <p className="text-[10px] text-slate-600 mb-1">Or select from your repos:</p>
                      {repos.map((r) => (
                        <button
                          key={r.fullName}
                          onClick={() => setConnectRepoName(r.fullName)}
                          className={cn(
                            "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                            connectRepoName === r.fullName
                              ? "bg-amber-700/30 text-amber-300"
                              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                          )}
                        >
                          {r.fullName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg p-2.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Step: Done ── */}
          {step === "done" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto border border-emerald-700/40">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-white mb-1">Repository connected!</p>
                <p className="text-sm text-slate-400">
                  <span className="text-amber-400 font-mono">{connectedRepo}</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Every publish will now push a commit to this repository. Connect Netlify in Publish settings to enable auto-deployment.
                </p>
              </div>
              <a
                href={`https://github.com/${connectedRepo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300"
              >
                <ExternalLink className="w-3 h-3" />
                View on GitHub
              </a>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button onClick={handleClose} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            {step === "done" ? "Close" : "Cancel"}
          </button>

          {step === "token" && (
            <button
              onClick={validateToken}
              disabled={!token.trim() || loading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs rounded-lg font-medium transition-colors"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
              Continue
            </button>
          )}

          {step === "repo" && (
            <button
              onClick={repoMode === "create" ? createRepo : connectRepo}
              disabled={loading || (repoMode === "create" ? !newRepoName.trim() : !connectRepoName.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs rounded-lg font-medium transition-colors"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
              {repoMode === "create" ? "Create & Connect" : "Connect Repo"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
