"use client";

/**
 * TemplateLibrary — pre-built page layouts staff can apply in one click.
 *
 * Rendered as a modal/drawer. Staff pick a template, preview its section
 * list, then click Apply to stamp it onto the current page (with undo).
 *
 * Templates are defined in /lib/template-registry.ts — adding a new
 * template there automatically surfaces it here.
 */

import { useState } from "react";
import {
  PAGE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PageTemplate,
} from "@/lib/template-registry";
import { useBuilderStore } from "@/lib/builder-store";
import { Button } from "@/components/ui/button";
import {
  Home, LayoutGrid, ShoppingBag, Zap, Info,
  Gem, Tag, X, Check, ChevronRight, Layers,
} from "lucide-react";

// ── Icon map ──────────────────────────────────────────────────────────────────

const catIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, LayoutGrid, ShoppingBag, Zap, Info,
};

const tplIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gem, Tag, LayoutGrid, ShoppingBag, Home, Zap, Info,
};

// ── Section count badge ───────────────────────────────────────────────────────

function SectionListPreview({ sections }: { sections: PageTemplate["sections"] }) {
  return (
    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
      {sections.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 rounded px-2 py-1.5"
        >
          <Layers className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="font-medium text-slate-300">{s.name}</span>
          {s.blocks && s.blocks.length > 0 && (
            <span className="ml-auto text-[10px] text-slate-500">
              {s.blocks.length} block{s.blocks.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onSelect,
  isSelected,
}: {
  template: PageTemplate;
  onSelect: (t: PageTemplate) => void;
  isSelected: boolean;
}) {
  const Icon = tplIconMap[template.icon] || Layers;

  return (
    <button
      onClick={() => onSelect(template)}
      className={`group text-left w-full rounded-lg border overflow-hidden transition-all ${
        isSelected
          ? "border-amber-500 ring-1 ring-amber-500/50 bg-slate-800"
          : "border-slate-700 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-8 h-8 text-slate-600" />
          </div>
        )}
        {/* Section count overlay */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full">
          {template.sections.length} sections
        </div>
        {isSelected && (
          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
            <div className="bg-amber-500 rounded-full p-1">
              <Check className="w-4 h-4 text-black" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          <Icon className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{template.name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{template.description}</p>
          </div>
        </div>
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] uppercase tracking-wider bg-slate-700/80 text-slate-400 px-1.5 py-0.5 rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface TemplateLibraryProps {
  onClose: () => void;
}

export function TemplateLibrary({ onClose }: TemplateLibraryProps) {
  const { selectedPageId, applyTemplate } = useBuilderStore();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selected, setSelected] = useState<PageTemplate | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const filtered =
    activeCategory === "all"
      ? PAGE_TEMPLATES
      : PAGE_TEMPLATES.filter((t) => t.category === activeCategory);

  const handleApply = () => {
    if (!selected || !selectedPageId) return;
    setApplying(true);
    // Small delay for UX feedback
    setTimeout(() => {
      applyTemplate(selectedPageId, selected.sections);
      setApplied(true);
      setTimeout(() => {
        setApplying(false);
        setApplied(false);
        onClose();
      }, 800);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <div>
            <h2 className="text-lg font-bold text-white">Template Library</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Apply a pre-built layout to the current page. You can customise every section after applying.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Left: category filter + template grid */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Category tabs */}
            <div className="flex gap-1.5 px-4 py-3 border-b border-slate-700/40 overflow-x-auto flex-shrink-0">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors ${
                  activeCategory === "all"
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                All templates
              </button>
              {TEMPLATE_CATEGORIES.map((cat) => {
                const Icon = catIconMap[cat.icon] || Layers;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors ${
                      activeCategory === cat.id
                        ? "bg-amber-500 text-black font-semibold"
                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Template grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <Layers className="w-8 h-8 mb-2" />
                  <p className="text-sm">No templates in this category yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filtered.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      onSelect={setSelected}
                      isSelected={selected?.id === tpl.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: detail panel */}
          <div className="w-80 border-l border-slate-700/60 flex flex-col bg-slate-900/50 flex-shrink-0">
            {selected ? (
              <>
                <div className="p-4 border-b border-slate-700/40">
                  <h3 className="text-sm font-bold text-white">{selected.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {selected.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selected.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] uppercase tracking-wider bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Section list preview */}
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2">
                    {selected.sections.length} sections included
                  </p>
                  <SectionListPreview sections={selected.sections} />
                </div>

                {/* Warning + Apply */}
                <div className="p-4 border-t border-slate-700/40">
                  <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                    ⚠️ Applying will replace <strong className="text-slate-400">all current sections</strong> on this page. You can undo with Ctrl+Z.
                  </p>
                  <Button
                    onClick={handleApply}
                    disabled={!selectedPageId || applying}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm"
                  >
                    {applied ? (
                      <><Check className="w-4 h-4 mr-1.5" /> Applied!</>
                    ) : applying ? (
                      "Applying…"
                    ) : (
                      <>Apply Template <ChevronRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                <Layers className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">Select a template to preview its sections</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
