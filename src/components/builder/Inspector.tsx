"use client";

import { useState } from "react";
import { useBuilderStore } from "@/lib/builder-store";
import { sectionRegistry } from "@/lib/section-registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Trash2, Settings, Copy, ChevronUp, ChevronDown, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldType, Section } from "@/types/builder";
import { ArrayField } from "@/components/builder/ArrayField";
import { ProductPicker } from "@/components/builder/ProductPicker";
import { FontPicker } from "@/components/builder/FontPicker";
import { ColorSchemePicker } from "@/components/builder/ColorSchemePicker";
import { ResponsivePanel } from "@/components/builder/ResponsivePanel";
import { BlocksEditor } from "@/components/builder/BlocksEditor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function Inspector() {
  const { project, selectedSectionId, updateSection, removeSection, selectSection, duplicateSection, moveSection } = useBuilderStore();
  const [tab, setTab] = useState("content");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!project || !selectedSectionId) return null;

  // Find the section in the client-hydrated sections dict
  const sectionOrUndef: Section | undefined = project.sections?.[selectedSectionId];

  if (!sectionOrUndef) return null;

  const section: Section = sectionOrUndef;

  const definition = sectionRegistry[section.type];
  if (!definition) return null;

  function handleSettingChange(key: string, value: unknown) {
    updateSection(section.id, {
      settings: { ...section.settings, [key]: value },
    });
  }

  function handleDelete() {
    removeSection(section.id);
    selectSection(null);
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionType: section.type, prompt: aiPrompt, currentSettings: section.settings }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json() as { settings?: Record<string, unknown>; error?: string };
      if (data.error) throw new Error(data.error);
      if (data.settings) {
        updateSection(section.id, { settings: { ...section.settings, ...data.settings } });
      }
      setAiOpen(false);
      setAiPrompt("");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-white flex-1">{section.name}</h2>
          <button
            onClick={() => { setAiOpen((v) => !v); setAiError(null); }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium transition-colors"
            title="Generate with AI"
          >
            <Sparkles className="w-3 h-3" />
            AI
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {definition.description}
        </p>
      </div>

      {/* AI Generate panel */}
      {aiOpen && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Generate with AI
            </span>
            <button onClick={() => setAiOpen(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe what you want, e.g. 'handmade gold jewellery for special occasions'"
            className="bg-slate-800 border-slate-700 text-white text-xs min-h-[60px]"
          />
          {aiError && <p className="text-xs text-red-400">{aiError}</p>}
          <Button
            onClick={handleAiGenerate}
            disabled={aiLoading || !aiPrompt.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs h-8"
          >
            {aiLoading ? "Generating…" : "Generate"}
          </Button>
        </div>
      )}

      <Tabs value={tab} onChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full rounded-none border-b border-slate-800 bg-slate-900 p-0 h-auto">
          <TabsTrigger value="content" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent py-2 text-xs">Content</TabsTrigger>
          {definition.blocks && definition.blocks.length > 0 && (
            <TabsTrigger value="items" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent py-2 text-xs">Items</TabsTrigger>
          )}
          <TabsTrigger value="responsive" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent py-2 text-xs">Responsive</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {Object.entries(definition.schema).map(([key, field]) => (
            <FieldRenderer
              key={key}
              fieldKey={key}
              field={field}
              value={section.settings[key]}
              onChange={(value) => handleSettingChange(key, value)}
            />
          ))}
        </TabsContent>

        {definition.blocks && definition.blocks.length > 0 && (
          <TabsContent value="items" className="flex-1 overflow-y-auto p-4 mt-0">
            <BlocksEditor
              section={section}
              sectionDef={definition}
              onChange={(blocks) => updateSection(section.id, { blocks })}
            />
          </TabsContent>
        )}

        <TabsContent value="responsive" className="flex-1 overflow-y-auto p-4 mt-0">
          <ResponsivePanel section={section} />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-slate-700"
            onClick={() => selectedSectionId && moveSection(selectedSectionId, -1)}
            title="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-slate-700"
            onClick={() => selectedSectionId && moveSection(selectedSectionId, 1)}
            title="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-slate-700"
            onClick={() => selectedSectionId && duplicateSection(selectedSectionId)}
            title="Duplicate (⌘D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Section
        </Button>
      </div>
    </aside>
  );
}

interface FieldRendererProps {
  fieldKey: string;
  field: {
    type: FieldType;
    label: string;
    options?: { label: string; value: string }[];
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
  };
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FieldRenderer({ fieldKey, field, value, onChange }: FieldRendererProps) {
  const id = `field-${fieldKey}`;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-300" htmlFor={id}>
        {field.label}
      </label>

      {field.type === "text" && (
        <Input
          id={id}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="bg-slate-800 border-slate-700 text-white"
        />
      )}

      {field.type === "textarea" && (
        <Textarea
          id={id}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
        />
      )}

      {field.type === "html" && (
        <Textarea
          id={id}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="bg-slate-800 border-slate-700 text-white min-h-[120px] font-mono text-xs"
        />
      )}

      {field.type === "image" && (
        <div className="space-y-2">
          <Input
            id={id}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="bg-slate-800 border-slate-700 text-white"
          />
          {typeof value === "string" && value.length > 0 && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value as string}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      )}

      {field.type === "color" && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(value as string) || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-9 rounded-md border border-slate-700 cursor-pointer"
          />
          <Input
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 bg-slate-800 border-slate-700 text-white font-mono text-sm"
          />
        </div>
      )}

      {field.type === "toggle" && (
        <Toggle
          pressed={!!value}
          onPressedChange={onChange}
          className={cn("w-full justify-start", value ? "bg-amber-500/20 text-amber-400" : "")}
        >
          {value ? "Enabled" : "Disabled"}
        </Toggle>
      )}

      {field.type === "select" && (
        <Select value={(value as string) || ""} onValueChange={onChange}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {field.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-white">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "number" && (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={field.min || 0}
            max={field.max || 100}
            step={field.step || 1}
            value={(value as number) || field.min || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-amber-500"
          />
          <span className="text-sm text-slate-400 w-12 text-right">{String(value ?? "")}</span>
        </div>
      )}

      {field.type === "color_scheme" && (
        <ColorSchemePicker value={(value as string) || ""} onChange={(v) => onChange(v)} />
      )}

      {field.type === "font_picker" && (
        <FontPicker value={(value as string) || ""} onChange={(v) => onChange(v)} />
      )}

      {field.type === "array" && fieldKey === "product_slugs" && (
        <ProductPicker
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(slugs) => onChange(slugs)}
        />
      )}

      {field.type === "array" && fieldKey !== "product_slugs" && (
        <ArrayField
          fieldKey={fieldKey}
          value={Array.isArray(value) ? (value as Parameters<typeof ArrayField>[0]["value"]) : []}
          onChange={(v) => onChange(v)}
        />
      )}
    </div>
  );
}
