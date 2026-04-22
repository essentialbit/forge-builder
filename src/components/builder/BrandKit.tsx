"use client";

import { useState } from "react";
import { useBuilderStore } from "@/lib/builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Palette, Type, Image as ImageIcon, SlidersHorizontal, Plus, Trash2, Star } from "lucide-react";
import { FontPicker } from "./FontPicker";
import { PRESET_SCHEMES } from "@/lib/theme";

interface BrandKitProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandKit({ open, onOpenChange }: BrandKitProps) {
  const { project, updateBrandKit } = useBuilderStore();
  const [tab, setTab] = useState("colors");

  if (!project) return null;
  const { theme } = project;
  const schemes = theme.colorSchemes ?? PRESET_SCHEMES;

  function updateScheme(id: string, patch: Partial<(typeof schemes)[number]>) {
    const updated = schemes.map((s) => (s.id === id ? { ...s, ...patch } : s));
    updateBrandKit({ colorSchemes: updated });
  }
  function addScheme() {
    const id = `scheme-${Date.now().toString(36)}`;
    updateBrandKit({
      colorSchemes: [
        ...schemes,
        {
          id,
          name: "Custom",
          background: "#ffffff",
          text: "#0a0a0a",
          accent: "#D4AF37",
          onAccent: "#0a0a0a",
          muted: "#6b7280",
          border: "#e5e7eb",
        },
      ],
    });
  }
  function deleteScheme(id: string) {
    if (schemes.length <= 1) return;
    updateBrandKit({
      colorSchemes: schemes.filter((s) => s.id !== id),
      defaultColorSchemeId: theme.defaultColorSchemeId === id ? schemes[0].id : theme.defaultColorSchemeId,
    });
  }
  function setDefaultScheme(id: string) {
    updateBrandKit({ defaultColorSchemeId: id });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Brand Kit
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onChange={setTab} className="pt-2">
          <TabsList className="bg-slate-800 p-1 mb-4">
            <TabsTrigger value="colors" className="data-[state=active]:bg-slate-700">
              <Palette className="w-3.5 h-3.5 mr-1.5" />
              Colours
            </TabsTrigger>
            <TabsTrigger value="type" className="data-[state=active]:bg-slate-700">
              <Type className="w-3.5 h-3.5 mr-1.5" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="tokens" className="data-[state=active]:bg-slate-700">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              Design tokens
            </TabsTrigger>
            <TabsTrigger value="logo" className="data-[state=active]:bg-slate-700">
              <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
              Logo
            </TabsTrigger>
          </TabsList>

          {/* Colours */}
          <TabsContent value="colors" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">Colour schemes</h3>
                <p className="text-xs text-slate-400">Reusable palettes. Sections pick a scheme or inherit the default.</p>
              </div>
              <Button size="sm" variant="outline" onClick={addScheme} className="border-slate-700">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add scheme
              </Button>
            </div>

            <div className="space-y-3">
              {schemes.map((s) => {
                const isDefault = theme.defaultColorSchemeId === s.id;
                return (
                  <div key={s.id} className={`border rounded-lg p-3 ${isDefault ? "border-amber-600/50 bg-amber-500/5" : "border-slate-700 bg-slate-800/30"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        value={s.name}
                        onChange={(e) => updateScheme(s.id, { name: e.target.value })}
                        className="h-7 text-sm font-semibold bg-slate-900 border-slate-700 text-white max-w-[240px]"
                      />
                      <button
                        onClick={() => setDefaultScheme(s.id)}
                        className={`text-xs flex items-center gap-1 ${isDefault ? "text-amber-400" : "text-slate-500 hover:text-slate-300"}`}
                        title="Set default"
                      >
                        <Star className={`w-3.5 h-3.5 ${isDefault ? "fill-amber-400" : ""}`} />
                        {isDefault ? "Default" : "Make default"}
                      </button>
                      <span className="flex-1" />
                      {schemes.length > 1 && (
                        <button
                          onClick={() => deleteScheme(s.id)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Swatch label="Background" value={s.background} onChange={(v) => updateScheme(s.id, { background: v })} />
                      <Swatch label="Text" value={s.text} onChange={(v) => updateScheme(s.id, { text: v })} />
                      <Swatch label="Accent" value={s.accent} onChange={(v) => updateScheme(s.id, { accent: v })} />
                      <Swatch label="On accent" value={s.onAccent} onChange={(v) => updateScheme(s.id, { onAccent: v })} />
                      <Swatch label="Muted" value={s.muted} onChange={(v) => updateScheme(s.id, { muted: v })} />
                      <Swatch label="Border" value={s.border} onChange={(v) => updateScheme(s.id, { border: v })} />
                    </div>

                    {/* Live preview tile */}
                    <div
                      className="mt-3 rounded-md p-3 border"
                      style={{ backgroundColor: s.background, color: s.text, borderColor: s.border }}
                    >
                      <div className="text-sm font-semibold">Sample heading</div>
                      <div className="text-xs mb-2" style={{ color: s.muted }}>Secondary text looks like this</div>
                      <button
                        className="px-3 py-1 text-xs rounded-md font-semibold"
                        style={{ background: s.accent, color: s.onAccent }}
                      >
                        Call to action
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Typography */}
          <TabsContent value="type" className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Body font</label>
              <FontPicker value={theme.fontFamily} onChange={(v) => updateBrandKit({ fontFamily: v })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Heading font (optional)</label>
              <FontPicker value={theme.headingFontFamily ?? ""} onChange={(v) => updateBrandKit({ headingFontFamily: v || undefined })} />
            </div>
          </TabsContent>

          {/* Design tokens */}
          <TabsContent value="tokens" className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Border radius scale</label>
              <select
                value={theme.radiusScale ?? "md"}
                onChange={(e) => updateBrandKit({ radiusScale: e.target.value as never })}
                className="w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
              >
                <option value="none">None (0)</option>
                <option value="sm">Small (4px)</option>
                <option value="md">Medium (8px)</option>
                <option value="lg">Large (16px)</option>
                <option value="full">Pill (full)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Spacing scale</label>
              <select
                value={theme.spacingScale ?? "normal"}
                onChange={(e) => updateBrandKit({ spacingScale: e.target.value as never })}
                className="w-full h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
              >
                <option value="tight">Tight</option>
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Max content width (px)</label>
              <Input
                type="number"
                min={600}
                max={1920}
                value={theme.maxContentWidth ?? 1200}
                onChange={(e) => updateBrandKit({ maxContentWidth: Number(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </TabsContent>

          {/* Logo */}
          <TabsContent value="logo" className="space-y-3">
            <label className="text-xs font-medium text-slate-300 block">Logo URL</label>
            <Input
              value={theme.logo || ""}
              onChange={(e) => updateBrandKit({ logo: e.target.value })}
              placeholder="https://yourlogo.com/logo.png"
              className="bg-slate-800 border-slate-700 text-white"
            />
            {theme.logo && (
              <div className="mt-2 aspect-video max-h-32 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={theme.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t border-slate-700">
          <Button onClick={() => onOpenChange(false)} className="bg-amber-500 hover:bg-amber-600 text-black">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Swatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-7 rounded-md border border-slate-700 cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-7 text-[11px] px-2 bg-slate-900 border-slate-700 text-white font-mono"
        />
      </div>
    </div>
  );
}
