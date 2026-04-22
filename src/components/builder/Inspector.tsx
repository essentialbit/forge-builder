"use client";

import { useBuilderStore } from "@/lib/builder-store";
import { sectionRegistry } from "@/lib/section-registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldType, Section } from "@/types/builder";
import { ArrayField } from "@/components/builder/ArrayField";

export function Inspector() {
  const { project, selectedSectionId, updateSection, removeSection, selectSection } = useBuilderStore();

  if (!project || !selectedSectionId) return null;

  // Find the section in the client-hydrated sections dict
  const section: Section | undefined = project.sections?.[selectedSectionId];

  if (!section) return null;

  const definition = sectionRegistry[section.type];
  if (!definition) return null;

  function handleSettingChange(key: string, value: unknown) {
    updateSection(section!.id, {
      settings: { ...section!.settings, [key]: value },
    });
  }

  function handleDelete() {
    removeSection(section!.id);
    selectSection(null);
  }

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-white">{section.name}</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {definition.description}
        </p>
      </div>

      {/* Settings Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(definition.schema).map(([key, field]) => (
          <FieldRenderer
            key={key}
            fieldKey={key}
            field={field}
            value={section!.settings[key]}
            onChange={(value) => handleSettingChange(key, value)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
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

function FieldRenderer({ fieldKey, field, value, onChange }: FieldRendererProps) {
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

      {field.type === "array" && (
        <ArrayField
          fieldKey={fieldKey}
          value={Array.isArray(value) ? (value as Parameters<typeof ArrayField>[0]["value"]) : []}
          onChange={(v) => onChange(v)}
        />
      )}
    </div>
  );
}
