"use client";

import { useMemo } from "react";
import { GOOGLE_FONTS } from "@/lib/theme";

/**
 * Font picker with live preview. Uses Google Fonts via the stylesheet
 * injected by the preview layout.
 */
export function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const grouped = useMemo(() => {
    const by: Record<string, typeof GOOGLE_FONTS> = {};
    for (const f of GOOGLE_FONTS) {
      by[f.category] = by[f.category] ?? [];
      by[f.category].push(f);
    }
    return by;
  }, []);

  // Dynamically inject Google Fonts preview stylesheet for the picker itself
  const fontsHref = useMemo(() => {
    const families = GOOGLE_FONTS.map((f) => `family=${encodeURIComponent(f.name)}:wght@400;600`).join("&");
    return `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }, []);

  return (
    <div className="space-y-2">
      {/* Preview stylesheet (cached after first load) */}
      <link rel="stylesheet" href={fontsHref} />

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
      >
        <option value="">Inherit from theme</option>
        {Object.entries(grouped).map(([cat, fonts]) => (
          <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
            {fonts.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {value && (
        <div
          className="px-3 py-2 rounded-md bg-slate-800/50 border border-slate-700 text-white"
          style={{ fontFamily: `"${value}", system-ui, sans-serif` }}
        >
          <div className="text-lg font-bold">The quick brown fox</div>
          <div className="text-sm opacity-70">jumps over the lazy dog</div>
        </div>
      )}
    </div>
  );
}
