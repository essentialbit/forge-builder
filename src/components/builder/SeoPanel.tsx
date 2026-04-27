"use client";

import { useBuilderStore } from "@/lib/builder-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

function charColor(len: number, warnAt: number, errorAt: number): string {
  if (len > errorAt) return "text-red-400";
  if (len > warnAt) return "text-amber-400";
  return "text-slate-500";
}

export function SeoPanel() {
  const { project, selectedPageId, updatePageSeo } = useBuilderStore();

  if (!project) return null;

  const currentPage =
    project.pages.find((p) => p.id === selectedPageId) ?? project.pages[0];

  if (!currentPage) return null;

  const seo = currentPage.seo ?? {};
  const title = seo.title ?? "";
  const description = seo.description ?? "";
  const ogImage = seo.ogImage ?? "";

  function update(field: "title" | "description" | "ogImage", value: string) {
    updatePageSeo(currentPage.id, { ...seo, [field]: value });
  }

  const previewTitle = title || project.name || "Page title";
  const previewDesc = description || "Add a meta description to appear in search results.";
  const previewUrl = `yourstore.com${currentPage.slug}`;

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-white">SEO Settings</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Page: <span className="text-slate-300">{currentPage.name}</span>
        </p>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* SEO Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">SEO Title</label>
            <span className={cn("text-xs", charColor(title.length, 60, 70))}>
              {title.length}/70
            </span>
          </div>
          <Input
            value={title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="My Store — Great Jewellery"
            className="bg-slate-800 border-slate-700 text-white"
          />
          {title.length > 60 && (
            <p className={cn("text-xs", charColor(title.length, 60, 70))}>
              {title.length > 70
                ? "Title is too long — search engines may truncate it."
                : "Title is getting long — aim for under 60 characters."}
            </p>
          )}
        </div>

        {/* Meta Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Meta Description</label>
            <span className={cn("text-xs", charColor(description.length, 155, 160))}>
              {description.length}/160
            </span>
          </div>
          <Textarea
            value={description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe this page for search engines…"
            className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
          />
          {description.length > 155 && (
            <p className={cn("text-xs", charColor(description.length, 155, 160))}>
              {description.length > 160
                ? "Description too long — it will be cut off in results."
                : "Almost at the limit — aim for under 155 characters."}
            </p>
          )}
        </div>

        {/* OG Image */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">OG Image URL</label>
          <Input
            value={ogImage}
            onChange={(e) => update("ogImage", e.target.value)}
            placeholder="https://yourstore.com/og.jpg"
            className="bg-slate-800 border-slate-700 text-white"
          />
          {ogImage && (
            <div className="relative aspect-video rounded overflow-hidden bg-slate-800 border border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogImage}
                alt="OG preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Google Preview */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Google Preview</p>
          <div className="bg-white rounded-lg p-3 space-y-0.5">
            <p className="text-xs text-slate-500 truncate">{previewUrl}</p>
            <p className="text-blue-700 text-sm font-medium leading-snug line-clamp-1">
              {previewTitle}
            </p>
            <p className="text-slate-600 text-xs leading-snug line-clamp-2">
              {previewDesc}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
