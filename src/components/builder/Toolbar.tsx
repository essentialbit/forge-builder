"use client";

import { useBuilderStore } from "@/lib/builder-store";
import { Button } from "@/components/ui/button";
import {
  Save,
  Eye,
  Upload,
  Palette,
  ArrowLeft,
  Check,
  Cloud,
  CloudOff,
  Package,
} from "lucide-react";
import Link from "next/link";

interface ToolbarProps {
  onBrandKitClick: () => void;
  onPublishClick: () => void;
}

export function Toolbar({ onBrandKitClick, onPublishClick }: ToolbarProps) {
  const { project, hasUnsavedChanges, isSaving, saveProject } = useBuilderStore();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Projects</span>
        </Link>

        <div className="h-6 w-px bg-slate-700" />

        <h1 className="text-white font-semibold">{project?.name || "Untitled"}</h1>

        {hasUnsavedChanges ? (
          <span className="flex items-center gap-1.5 text-amber-400 text-sm">
            <CloudOff className="w-4 h-4" />
            Unsaved
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-green-400 text-sm">
            <Cloud className="w-4 h-4" />
            Saved
          </span>
        )}
      </div>

      {/* Center - Device Preview */}
      <DeviceSwitcher />

      {/* Right */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products" target="_blank">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white">
            <Package className="w-4 h-4 mr-2" />
            Catalog
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={onBrandKitClick}
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          <Palette className="w-4 h-4 mr-2" />
          Brand Kit
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={saveProject}
          disabled={!hasUnsavedChanges || isSaving}
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>

        <Link href={`/preview/${project?.id}`} target="_blank">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </Link>

        <Button
          size="sm"
          onClick={onPublishClick}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          <Upload className="w-4 h-4 mr-2" />
          Publish
        </Button>
      </div>
    </header>
  );
}

function DeviceSwitcher() {
  const { previewDevice, setPreviewDevice } = useBuilderStore();

  const devices = [
    { id: "desktop", label: "Desktop", width: "w-5" },
    { id: "tablet", label: "Tablet", width: "w-4" },
    { id: "mobile", label: "Mobile", width: "w-3" },
  ] as const;

  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
      {devices.map((device) => (
        <button
          key={device.id}
          onClick={() => setPreviewDevice(device.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            previewDevice === device.id
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className={`inline-block ${device.width} h-4 mr-2`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              {device.id === "desktop" && (
                <path d="M4 4h16v12H4V4zm2 2v8h12V6H6zm-3 14h18v2H3v-2z" />
              )}
              {device.id === "tablet" && (
                <path d="M6 4h12v16H6V4zm2 2v12h8V6H8z" />
              )}
              {device.id === "mobile" && (
                <path d="M7 3h10v18H7V3zm2 2v14h6V5H9zm3 16h2v2h-2v-2z" />
              )}
            </svg>
          </span>
          {device.label}
        </button>
      ))}
    </div>
  );
}
