"use client";

import { useBuilderStore } from "@/lib/builder-store";
import { PRESET_SCHEMES } from "@/lib/theme";
import { Check } from "lucide-react";

export function ColorSchemePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { project } = useBuilderStore();
  const schemes = project?.theme.colorSchemes && project.theme.colorSchemes.length > 0 ? project.theme.colorSchemes : PRESET_SCHEMES;

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`text-left p-2 rounded-md border transition-colors ${
          !value ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
        }`}
      >
        <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          {!value && <Check className="w-3 h-3 text-amber-400" />}
          Default
        </div>
        <div className="text-[10px] text-slate-500">Inherits from page</div>
      </button>
      {schemes.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={`text-left p-2 rounded-md border transition-colors ${
            value === s.id
              ? "border-amber-500 bg-amber-500/10"
              : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
          }`}
        >
          <div className="flex items-center gap-1 mb-1">
            <span
              className="w-4 h-4 rounded-sm border border-slate-700"
              style={{ backgroundColor: s.background }}
            />
            <span
              className="w-4 h-4 rounded-sm border border-slate-700"
              style={{ backgroundColor: s.accent }}
            />
            <span
              className="w-4 h-4 rounded-sm border border-slate-700"
              style={{ backgroundColor: s.text }}
            />
            {value === s.id && <Check className="w-3 h-3 text-amber-400 ml-auto" />}
          </div>
          <div className="text-xs font-medium text-slate-300">{s.name}</div>
        </button>
      ))}
    </div>
  );
}
