"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";

type PrimitiveValue = string | number | boolean;
type ItemValue = PrimitiveValue | Record<string, unknown> | ItemValue[];

interface ArrayFieldProps {
  value: ItemValue[];
  onChange: (value: ItemValue[]) => void;
  fieldKey: string;
}

/**
 * Generic array editor. Infers the item shape from the first element
 * (or falls back to { label, url } for common link shapes).
 * Supports nested array fields (e.g. footer columns → links).
 */
export function ArrayField({ value, onChange, fieldKey }: ArrayFieldProps) {
  const items: ItemValue[] = Array.isArray(value) ? value : [];
  const template = inferTemplate(items, fieldKey);

  function addItem() {
    onChange([...items, cloneTemplate(template)]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, next: ItemValue) {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  }

  function moveItem(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    onChange(copy);
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-xs text-slate-500 italic py-2">
            No items — click &quot;Add&quot; to create one.
          </div>
        )}
        {items.map((item, i) => (
          <ArrayItem
            key={i}
            index={i}
            value={item}
            template={template}
            onChange={(v) => updateItem(i, v)}
            onRemove={() => removeItem(i)}
            onMoveUp={i > 0 ? () => moveItem(i, -1) : undefined}
            onMoveDown={i < items.length - 1 ? () => moveItem(i, 1) : undefined}
          />
        ))}
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={addItem}
        className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add {singularize(fieldKey)}
      </Button>
    </div>
  );
}

interface ArrayItemProps {
  index: number;
  value: ItemValue;
  template: ItemValue;
  onChange: (v: ItemValue) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function ArrayItem({ index, value, template, onChange, onRemove, onMoveUp, onMoveDown }: ArrayItemProps) {
  const [expanded, setExpanded] = useState(true);

  // Primitive (string)
  if (typeof template === "string" || typeof template === "number" || typeof template === "boolean") {
    return (
      <div className="flex items-center gap-1.5 bg-slate-800/50 border border-slate-700 rounded-md p-1.5">
        <GripVertical className="w-3 h-3 text-slate-600" />
        <Input
          value={String(value ?? "")}
          onChange={(e) => {
            const v = e.target.value;
            if (typeof template === "number") {
              const n = Number(v);
              onChange(Number.isFinite(n) ? n : 0);
            } else if (typeof template === "boolean") {
              onChange(v === "true");
            } else {
              onChange(v);
            }
          }}
          className="flex-1 h-7 text-xs bg-slate-900 border-slate-700 text-white"
        />
        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-red-400" onClick={onRemove}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  // Object: render fields, with nested array support
  const obj = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  const fields = Object.keys(template as Record<string, unknown>);
  const label = deriveItemLabel(obj, index);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-md overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-800/80">
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 hover:bg-slate-700 rounded"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </button>
        <span className="flex-1 text-xs font-medium text-slate-300 truncate">{label}</span>
        {onMoveUp && (
          <button onClick={onMoveUp} className="text-xs text-slate-500 hover:text-white px-1">↑</button>
        )}
        {onMoveDown && (
          <button onClick={onMoveDown} className="text-xs text-slate-500 hover:text-white px-1">↓</button>
        )}
        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-red-400" onClick={onRemove}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {expanded && (
        <div className="p-2 space-y-2">
          {fields.map((key) => {
            const sub = (template as Record<string, unknown>)[key];
            const current = obj[key];

            // Nested array (e.g. footer column → links)
            if (Array.isArray(sub)) {
              return (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">{prettifyKey(key)}</label>
                  <ArrayField
                    fieldKey={key}
                    value={Array.isArray(current) ? (current as ItemValue[]) : []}
                    onChange={(next) => onChange({ ...obj, [key]: next })}
                  />
                </div>
              );
            }

            return (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium text-slate-400">{prettifyKey(key)}</label>
                <Input
                  value={String(current ?? "")}
                  onChange={(e) => onChange({ ...obj, [key]: e.target.value })}
                  className="h-7 text-xs bg-slate-900 border-slate-700 text-white"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function inferTemplate(items: ItemValue[], fieldKey: string): ItemValue {
  if (items.length > 0) {
    const first = items[0];
    if (typeof first === "object" && first !== null) {
      // Return an empty version of the first item's shape
      const obj = first as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (Array.isArray(v)) {
          out[k] = v.length > 0 ? [inferTemplate(v as ItemValue[], k)] : [];
        } else if (typeof v === "object" && v !== null) {
          out[k] = {};
        } else if (typeof v === "number") {
          out[k] = 0;
        } else if (typeof v === "boolean") {
          out[k] = false;
        } else {
          out[k] = "";
        }
      }
      return out;
    }
    return typeof first === "number" ? 0 : typeof first === "boolean" ? false : "";
  }

  // No items → guess from field name
  const k = fieldKey.toLowerCase();
  if (k.includes("link") || k.includes("badge") || k.includes("social")) {
    return { label: "", url: "" };
  }
  if (k.includes("column")) {
    return { heading: "", links: [] as unknown[] };
  }
  if (k.includes("slug")) {
    return "";
  }
  return "";
}

function cloneTemplate(template: ItemValue): ItemValue {
  if (Array.isArray(template)) return [] as ItemValue[];
  if (typeof template === "object" && template !== null) {
    return JSON.parse(JSON.stringify(template)) as Record<string, unknown>;
  }
  return template;
}

function deriveItemLabel(obj: Record<string, unknown>, index: number): string {
  const keys = ["heading", "label", "name", "title", "text", "slug"];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return `Item ${index + 1}`;
}

function prettifyKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function singularize(word: string): string {
  const clean = prettifyKey(word);
  if (clean.endsWith("ies")) return clean.slice(0, -3) + "y";
  if (clean.endsWith("s")) return clean.slice(0, -1);
  return clean;
}
