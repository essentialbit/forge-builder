"use client";

import { useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/builder-store";
import { CheckCircle2, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "forge-onboarding-dismissed";
const BRANDKIT_KEY = "forge-brandkit-opened";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export function OnboardingChecklist() {
  const { project, deployConfig } = useBuilderStore();
  const [dismissed, setDismissed] = useState(true); // start true to avoid flash
  const [productCount, setProductCount] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  // ── ALL hooks must be declared before any early return ──────────────────────

  // Hydrate dismissed state from localStorage on mount
  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISSED_KEY) === "true";
    setDismissed(wasDismissed);
  }, []);

  // Fetch product count whenever the checklist becomes visible
  useEffect(() => {
    if (dismissed) return;
    fetch("/api/catalog/products?limit=1")
      .then((r) => r.json())
      .then((data) => {
        const count =
          typeof data?.total === "number"
            ? data.total
            : Array.isArray(data?.products)
            ? data.products.length
            : Array.isArray(data)
            ? data.length
            : null;
        setProductCount(count);
      })
      .catch(() => setProductCount(null));
  }, [dismissed]);

  // Derive checklist items (safe to do before early return — just depends on project)
  const brandKitOpened =
    typeof window !== "undefined" &&
    localStorage.getItem(BRANDKIT_KEY) === "true";
  const brandChanged = project?.theme.primaryColor !== "#D4AF37";
  const hasHero = project?.pages.some((p) =>
    p.sections.some((id) => project.sections?.[id]?.type === "hero")
  ) ?? false;
  const hasProducts = productCount !== null && productCount > 0;
  const hasGithub = Boolean(deployConfig?.githubRepo);
  const isPublished = project?.status === "published";

  const items: ChecklistItem[] = project
    ? [
        { id: "brand",   label: "Set your brand colors",  checked: brandChanged || brandKitOpened },
        { id: "hero",    label: "Add a hero section",      checked: hasHero },
        { id: "products",label: "Add your products",       checked: hasProducts },
        { id: "deploy",  label: "Configure publishing",    checked: hasGithub },
        { id: "publish", label: "Publish your site",       checked: isPublished },
      ]
    : [];

  const completedCount = items.filter((i) => i.checked).length;
  const allDone = items.length > 0 && completedCount === items.length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  // Celebrate when all steps complete — guard inside effect, not around it
  useEffect(() => {
    if (dismissed || !project || !allDone || celebrating) return;
    setCelebrating(true);
    const timer = setTimeout(() => {
      localStorage.setItem(DISMISSED_KEY, "true");
      setDismissed(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [allDone, celebrating, dismissed, project]);

  // ── Early return is now safe — all hooks have already been called ───────────
  if (dismissed || !project) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">
          Getting Started {celebrating ? "🎉" : "🔨"}
        </span>
        <button
          onClick={handleDismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-amber-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Celebration message */}
      {celebrating && (
        <div className="p-3 text-center text-sm text-amber-400 font-medium animate-pulse">
          All done — great work! 🎉
        </div>
      )}

      {/* Items */}
      {!celebrating && (
        <div className="p-3 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5">
              {item.checked ? (
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600 shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs",
                  item.checked ? "text-slate-400 line-through" : "text-slate-200"
                )}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {!celebrating && (
        <div className="px-3 pb-3">
          <p className="text-xs text-slate-500">
            {completedCount} of {items.length} complete
          </p>
        </div>
      )}
    </div>
  );
}
