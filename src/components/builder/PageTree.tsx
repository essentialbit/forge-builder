"use client";

import { useState } from "react";
import { useBuilderStore } from "@/lib/builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  File,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";

export function PageTree() {
  const { project, selectedPageId, selectedSectionId, selectPage, selectSection, addPage, removePage, renamePage } = useBuilderStore();
  const [expandedPages, setExpandedPages] = useState<Set<string>>(
    () => new Set(selectedPageId ? [selectedPageId] : [])
  );
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  function togglePage(pageId: string) {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  }

  function startEditing(pageId: string, currentName: string) {
    setEditingPageId(pageId);
    setEditingName(currentName);
  }

  function finishEditing() {
    if (editingPageId && editingName.trim()) {
      renamePage(editingPageId, editingName.trim());
    }
    setEditingPageId(null);
    setEditingName("");
  }

  function handleAddPage() {
    if (!project) return;
    addPage(`Page ${project.pages.length + 1}`);
  }

  if (!project) return null;

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pages</span>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddPage}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="space-y-0.5">
        {project.pages.map((page) => {
          const isExpanded = expandedPages.has(page.id);
          const isSelected = selectedPageId === page.id;

          return (
            <div key={page.id}>
              <ContextMenu>
                <ContextMenuTrigger>
                  <div
                    className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-400"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <button
                      onClick={() => {
                        togglePage(page.id);
                        selectPage(page.id);
                      }}
                      className="p-0.5 hover:bg-slate-700 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <File className="w-4 h-4 flex-shrink-0" />

                    {editingPageId === page.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={finishEditing}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") finishEditing();
                          if (e.key === "Escape") {
                            setEditingPageId(null);
                            setEditingName("");
                          }
                        }}
                        className="h-5 text-sm bg-slate-700 border-slate-600"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="flex-1 text-sm truncate"
                        onClick={() => selectPage(page.id)}
                      >
                        {page.name}
                      </span>
                    )}

                    <span className="text-xs text-slate-500">{page.sections.length}</span>
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent>
                  <ContextMenuItem onClick={() => startEditing(page.id, page.name)}>
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => removePage(page.id)}
                    disabled={project.pages.length <= 1}
                    className="text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              {/* Section children */}
              {isExpanded && page.sections.length > 0 && (
                <div className="ml-6 mt-0.5 space-y-0.5">
                  {page.sections.map((sectionId) => {
                    const isSectionSelected = selectedSectionId === sectionId;
                    return (
                      <div
                        key={sectionId}
                        onClick={() => selectSection(sectionId)}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm cursor-pointer transition-colors ${
                          isSectionSelected
                            ? "bg-slate-700 text-white"
                            : "hover:bg-slate-800/50 text-slate-400"
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        <span className="truncate">{sectionId}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
