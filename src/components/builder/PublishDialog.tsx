"use client";

import { useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Github,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishDialog({ open, onOpenChange }: PublishDialogProps) {
  const {
    project,
    publish,
    deployConfig,
    setDeployConfig,
    publishProject,
    resetPublishState,
    hasUnsavedChanges,
  } = useBuilderStore();

  const [buildPreviewLoading, setBuildPreviewLoading] = useState(false);
  const [buildPreviewUrl, setBuildPreviewUrl] = useState<string | null>(null);
  const [buildPreviewError, setBuildPreviewError] = useState<string | null>(null);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [logsExpanded, setLogsExpanded] = useState(false);

  // Reset state when dialog re-opens after a success/error
  useEffect(() => {
    if (open && (publish.stage === "success" || publish.stage === "error")) {
      // keep the result visible but clear stale preview url when editing again
    }
  }, [open, publish.stage]);

  if (!project) return null;

  const isPublishing = ["validating", "saving", "exporting", "pushing", "deploying"].includes(publish.stage);
  const isDone = publish.stage === "success";
  const isError = publish.stage === "error";

  async function buildPreview() {
    if (!project) return;
    setBuildPreviewLoading(true);
    setBuildPreviewError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/preview-build`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Build failed (${res.status})`);
      setBuildPreviewUrl(data.previewUrl);
    } catch (e) {
      setBuildPreviewError(e instanceof Error ? e.message : String(e));
    } finally {
      setBuildPreviewLoading(false);
    }
  }

  async function handlePublish() {
    await publishProject();
  }

  function handleClose() {
    if (isPublishing) return; // don't close mid-publish
    onOpenChange(false);
  }

  function handleReset() {
    resetPublishState();
    setBuildPreviewUrl(null);
    setBuildPreviewError(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-400" />
            Publish {project.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Preview your built site, then push to GitHub and deploy to Netlify in one click.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Pre-flight checks */}
          <Checklist project={project} hasUnsavedChanges={hasUnsavedChanges} deployConfig={deployConfig} />

          {/* Deploy config */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-800"
              onClick={() => setConfigExpanded((v) => !v)}
            >
              {configExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-white">Deploy targets</span>
              <span className="text-xs text-slate-400 ml-auto">
                {[deployConfig.githubRepo && "GitHub", deployConfig.netlifySiteId && "Netlify"]
                  .filter(Boolean)
                  .join(" + ") || "Not configured"}
              </span>
            </button>

            {configExpanded && (
              <div className="p-4 space-y-3 border-t border-slate-700">
                <DeployField
                  icon={<Github className="w-4 h-4" />}
                  label="GitHub repo"
                  placeholder="owner/repo (e.g. essentialbit/my-site)"
                  value={deployConfig.githubRepo ?? ""}
                  onChange={(v) => setDeployConfig({ githubRepo: v || undefined })}
                  hint="Leave empty to skip GitHub sync"
                />
                <DeployField
                  icon={<Github className="w-4 h-4 opacity-50" />}
                  label="Branch"
                  placeholder="main"
                  value={deployConfig.githubBranch ?? ""}
                  onChange={(v) => setDeployConfig({ githubBranch: v || undefined })}
                />
                <DeployField
                  icon={<Globe className="w-4 h-4" />}
                  label="Netlify site ID"
                  placeholder="5181df3b-47b2-4e5d-87a4-833e124e518e"
                  value={deployConfig.netlifySiteId ?? ""}
                  onChange={(v) => setDeployConfig({ netlifySiteId: v || undefined })}
                  hint="From Netlify \u2192 Site settings \u2192 General \u2192 Site information \u2192 Site ID"
                />
              </div>
            )}
          </div>

          {/* Build preview */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">Preview build</h3>
                <p className="text-xs text-slate-400 mb-3">
                  See exactly what will be deployed \u2014 the live preview shows the in-editor state, this shows the
                  compiled static site.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={buildPreview}
                    disabled={buildPreviewLoading || isPublishing}
                    className="border-slate-600"
                  >
                    {buildPreviewLoading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {buildPreviewLoading ? "Building\u2026" : "Build preview"}
                  </Button>
                  {buildPreviewUrl && (
                    <a href={buildPreviewUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-slate-600 text-amber-400">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Open preview
                      </Button>
                    </a>
                  )}
                </div>
                {buildPreviewError && (
                  <p className="text-xs text-red-400 mt-2 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {buildPreviewError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress during publish */}
          {(isPublishing || isDone || isError) && (
            <PublishProgress onReset={handleReset} />
          )}

          {/* Logs */}
          {publish.logs.length > 0 && (
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-800"
                onClick={() => setLogsExpanded((v) => !v)}
              >
                {logsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span className="text-xs font-medium text-slate-300">
                  Logs ({publish.logs.length})
                </span>
                {publish.logs.some((l) => l.level === "error") && (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 ml-auto" />
                )}
              </button>
              {logsExpanded && (
                <div className="px-4 py-2 border-t border-slate-700 max-h-48 overflow-y-auto">
                  {publish.logs.map((l, i) => (
                    <div
                      key={i}
                      className={`text-xs font-mono py-0.5 ${
                        l.level === "error"
                          ? "text-red-400"
                          : l.level === "warn"
                            ? "text-amber-400"
                            : "text-slate-400"
                      }`}
                    >
                      <span className="opacity-50 mr-2">
                        {new Date(l.t).toLocaleTimeString()}
                      </span>
                      {l.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-700 mt-2">
          <Button variant="outline" onClick={handleClose} disabled={isPublishing}>
            {isDone ? "Done" : "Cancel"}
          </Button>
          {!isDone && (
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Publishing\u2026
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1.5" />
                  {isError ? "Retry publish" : "Publish now"}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeployField({
  icon,
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
        {icon}
        {label}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-slate-900 border-slate-700 text-white text-sm"
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function Checklist({
  project,
  hasUnsavedChanges,
  deployConfig,
}: {
  project: { pages: Array<{ sections: string[] }> };
  hasUnsavedChanges: boolean;
  deployConfig: { githubRepo?: string; netlifySiteId?: string };
}) {
  const totalSections = project.pages.reduce((acc, p) => acc + p.sections.length, 0);
  const checks = [
    {
      ok: project.pages.length > 0,
      label: `Has pages`,
      detail: `${project.pages.length} page${project.pages.length === 1 ? "" : "s"}`,
    },
    {
      ok: totalSections > 0,
      label: `Has sections`,
      detail: `${totalSections} section${totalSections === 1 ? "" : "s"}`,
    },
    {
      ok: !hasUnsavedChanges,
      label: "All changes saved",
      detail: hasUnsavedChanges ? "Will be saved before publish" : "Up to date",
      warning: hasUnsavedChanges,
    },
    {
      ok: Boolean(deployConfig.githubRepo || deployConfig.netlifySiteId),
      label: "Deploy target configured",
      detail:
        deployConfig.githubRepo || deployConfig.netlifySiteId
          ? [deployConfig.githubRepo && "GitHub", deployConfig.netlifySiteId && "Netlify"].filter(Boolean).join(" + ")
          : "Local export only",
      warning: !(deployConfig.githubRepo || deployConfig.netlifySiteId),
    },
  ];

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Pre-flight
      </h3>
      <ul className="space-y-1">
        {checks.map((c, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            {c.ok ? (
              c.warning ? (
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              )
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span className={c.ok ? "text-slate-300" : "text-red-400"}>{c.label}</span>
            <span className="text-xs text-slate-500 ml-auto">{c.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PublishProgress({ onReset }: { onReset: () => void }) {
  const { publish } = useBuilderStore();
  const isError = publish.stage === "error";
  const isDone = publish.stage === "success";

  return (
    <div
      className={`border rounded-lg p-4 ${
        isError ? "border-red-900 bg-red-950/30" : isDone ? "border-green-900 bg-green-950/30" : "border-amber-900 bg-amber-950/20"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {isError ? (
          <AlertCircle className="w-5 h-5 text-red-400" />
        ) : isDone ? (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        ) : (
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
        )}
        <h3 className="text-sm font-semibold text-white flex-1">{publish.message || publish.stage}</h3>
        {(isError || isDone) && (
          <button onClick={onReset} className="text-xs text-slate-400 hover:text-white">
            Reset
          </button>
        )}
      </div>

      {!isError && (
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isDone ? "bg-green-500" : "bg-amber-500"
            }`}
            style={{ width: `${publish.progress}%` }}
          />
        </div>
      )}

      {isError && publish.error && (
        <div className="text-xs text-red-300 font-mono bg-red-950/50 rounded p-2 mt-2 break-words">
          {publish.error}
        </div>
      )}

      {isDone && publish.deployUrl && (
        <div className="mt-2">
          <a
            href={publish.deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-400 hover:text-green-300 inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {publish.deployUrl}
          </a>
          {publish.commitSha && (
            <div className="text-xs text-slate-400 mt-1">
              Commit: <code className="font-mono">{publish.commitSha.slice(0, 7)}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
