"use client";

import { useBuilderStore } from "@/lib/builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Palette, Type, Image as ImageIcon } from "lucide-react";

interface BrandKitProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fontOptions = [
  { label: "Inter", value: "Inter" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Lato", value: "Lato" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Poppins", value: "Poppins" },
  { label: "Raleway", value: "Raleway" },
];

export function BrandKit({ open, onOpenChange }: BrandKitProps) {
  const { project, updateBrandKit } = useBuilderStore();

  if (!project) return null;

  const { theme } = project;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Brand Kit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Colors */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-400 to-amber-600" />
              Colors
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <ColorField
                label="Primary"
                value={theme.primaryColor}
                onChange={(v) => updateBrandKit({ primaryColor: v })}
              />
              <ColorField
                label="Secondary"
                value={theme.secondaryColor}
                onChange={(v) => updateBrandKit({ secondaryColor: v })}
              />
              <ColorField
                label="Accent"
                value={theme.accentColor}
                onChange={(v) => updateBrandKit({ accentColor: v })}
              />
            </div>
          </div>

          {/* Typography */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Type className="w-4 h-4" />
              Typography
            </h3>
            <select
              value={theme.fontFamily}
              onChange={(e) => updateBrandKit({ fontFamily: e.target.value })}
              className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-white px-3"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Logo */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Logo
            </h3>
            <Input
              value={theme.logo || ""}
              onChange={(e) => updateBrandKit({ logo: e.target.value })}
              placeholder="https://yourlogo.com/logo.png"
              className="bg-slate-800 border-slate-700 text-white"
            />
            {theme.logo && (
              <div className="mt-2 aspect-video max-h-20 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={theme.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Preview</h3>
            <div
              className="p-4 rounded-lg border border-slate-700"
              style={{ backgroundColor: theme.secondaryColor }}
            >
              <p
                className="text-2xl font-bold"
                style={{ color: theme.primaryColor, fontFamily: theme.fontFamily }}
              >
                Your Brand Name
              </p>
              <p style={{ color: theme.accentColor }}>
                Your tagline or brand message goes here
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: theme.primaryColor,
                    color: theme.secondaryColor,
                  }}
                >
                  Primary CTA
                </button>
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium border"
                  style={{
                    borderColor: theme.primaryColor,
                    color: theme.primaryColor,
                  }}
                >
                  Secondary
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-md border border-slate-700 cursor-pointer"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 rounded-md border border-slate-700 bg-slate-800 text-white text-xs px-2 font-mono"
        />
      </div>
    </div>
  );
}
