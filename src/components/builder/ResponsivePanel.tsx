"use client";

import { useBuilderStore } from "@/lib/builder-store";
import { Smartphone, Tablet, Monitor, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Section } from "@/types/builder";

export function ResponsivePanel({ section }: { section: Section }) {
  const { updateSection } = useBuilderStore();
  const r = section.responsive ?? {};

  function set(patch: Partial<Section["responsive"]>) {
    updateSection(section.id, { responsive: { ...r, ...patch } });
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Visibility</h4>
        <div className="space-y-1.5">
          <VisRow label="Desktop" Icon={Monitor} hidden={r.hideDesktop} onToggle={() => set({ hideDesktop: !r.hideDesktop })} />
          <VisRow label="Tablet" Icon={Tablet} hidden={r.hideTablet} onToggle={() => set({ hideTablet: !r.hideTablet })} />
          <VisRow label="Mobile" Icon={Smartphone} hidden={r.hideMobile} onToggle={() => set({ hideMobile: !r.hideMobile })} />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Mobile overrides
        </h4>
        {"columns" in (section.settings as object) && (
          <OverrideField
            label="Columns on mobile"
            value={(r.mobile?.columns as number) ?? ""}
            defaultValue={String(section.settings.columns ?? 3)}
            placeholder="inherit"
            onChange={(v) => set({ mobile: { ...r.mobile, columns: v ? Number(v) : undefined } })}
          />
        )}
        {"text_alignment" in (section.settings as object) && (
          <OverrideField
            label="Text alignment on mobile"
            value={(r.mobile?.text_alignment as string) ?? ""}
            defaultValue={String(section.settings.text_alignment ?? "center")}
            placeholder="inherit"
            onChange={(v) => set({ mobile: { ...r.mobile, text_alignment: v || undefined } })}
          />
        )}
        <p className="text-[10px] text-slate-500 mt-2">Leave blank to inherit from desktop. More override fields coming soon.</p>
      </div>
    </div>
  );
}

function VisRow({ label, Icon, hidden, onToggle }: { label: string; Icon: typeof Monitor; hidden?: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border text-xs transition-colors ${
        hidden ? "border-red-900 bg-red-950/30 text-red-400" : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="flex-1 text-left">{label}</span>
      {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      <span>{hidden ? "Hidden" : "Visible"}</span>
    </button>
  );
}

function OverrideField({
  label,
  value,
  defaultValue,
  placeholder,
  onChange,
}: {
  label: string;
  value: string | number;
  defaultValue?: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-2">
      <label className="text-xs text-slate-400 flex items-center justify-between mb-1">
        <span>{label}</span>
        {defaultValue && <span className="text-[10px] text-slate-600 font-mono">default: {defaultValue}</span>}
      </label>
      <Input
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-slate-800 border-slate-700 text-white h-8 text-sm"
      />
    </div>
  );
}
