"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBuilderStore } from "@/lib/builder-store";
import { sectionRegistry, sectionCategories } from "@/lib/section-registry";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, Package, Save, Upload, Palette, Undo, Redo, Plus, ExternalLink } from "lucide-react";

/**
 * ⌘K command palette — Notion/Linear-style quick actions.
 * Includes: add section, jump to page, save, publish, open admin,
 * brand kit, undo/redo.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const {
    project,
    selectedPageId,
    addSection,
    saveProject,
    undo,
    redo,
    canUndo,
    canRedo,
    selectPage,
  } = useBuilderStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  type Item = {
    id: string;
    label: string;
    hint?: string;
    icon: React.ComponentType<{ className?: string }>;
    shortcut?: string;
    action: () => void;
  };

  const items: Item[] = useMemo(() => {
    const list: Item[] = [];

    // Core actions
    list.push({
      id: "save",
      label: "Save project",
      icon: Save,
      shortcut: "⌘S",
      action: () => saveProject(),
    });
    if (canUndo()) list.push({ id: "undo", label: "Undo", icon: Undo, shortcut: "⌘Z", action: undo });
    if (canRedo()) list.push({ id: "redo", label: "Redo", icon: Redo, shortcut: "⌘⇧Z", action: redo });

    // Pages
    for (const p of project?.pages ?? []) {
      list.push({
        id: `page-${p.id}`,
        label: `Go to page: ${p.name}`,
        hint: p.slug,
        icon: FileText,
        action: () => selectPage(p.id),
      });
    }

    // Section types (add to current page)
    if (selectedPageId) {
      for (const type of Object.keys(sectionRegistry)) {
        const def = sectionRegistry[type];
        const cat = sectionCategories.find((c) => c.id === def.category);
        list.push({
          id: `add-${type}`,
          label: `Add section: ${def.name}`,
          hint: cat?.name,
          icon: Plus,
          action: () => {
            addSection(selectedPageId, type);
          },
        });
      }
    }

    // Navigation
    list.push({
      id: "admin-products",
      label: "Open Catalog admin",
      icon: Package,
      action: () => window.open("/admin/products", "_blank"),
    });
    list.push({
      id: "admin-revisions",
      label: "Open Revisions",
      icon: ExternalLink,
      action: () => window.open("/admin/revisions", "_blank"),
    });
    list.push({
      id: "projects-home",
      label: "Back to projects",
      icon: FileText,
      action: () => router.push("/"),
    });

    return list;
  }, [project, selectedPageId, canUndo, canRedo, addSection, saveProject, undo, redo, selectPage, router]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((i) =>
      (i.label.toLowerCase().includes(qq) || i.hint?.toLowerCase().includes(qq)),
    );
  }, [q, items]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command…"
            autoFocus
            className="border-0 bg-transparent text-white focus-visible:ring-0 h-9"
          />
          <span className="text-[10px] font-mono text-slate-600">esc</span>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No matches.</p>
          ) : (
            filtered.slice(0, 30).map((i) => (
              <button
                key={i.id}
                onClick={() => {
                  i.action();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-800 text-sm"
              >
                <i.icon className="w-4 h-4 text-slate-400" />
                <span className="flex-1 text-slate-200">
                  {i.label}
                  {i.hint && <span className="ml-2 text-xs text-slate-500">{i.hint}</span>}
                </span>
                {i.shortcut && (
                  <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {i.shortcut}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
