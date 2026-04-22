"use client";

import { useRef, useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/builder-store";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const deviceWidths = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

export function Canvas() {
  const { project, previewDevice, previewScale, setPreviewScale, selectedSectionId, selectSection } = useBuilderStore();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const baseWidth = deviceWidths[previewDevice];
  const scaledWidth = (baseWidth * previewScale) / 100;

  useEffect(() => {
    setIframeLoaded(false);
  }, [project?.id, previewDevice]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const handleZoomIn = () => setPreviewScale(previewScale + 10);
  const handleZoomOut = () => setPreviewScale(previewScale - 10);
  const handleZoomReset = () => setPreviewScale(100);

  if (!project) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      {/* Canvas Controls */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-center gap-4 px-4">
        <div className="flex items-center gap-1 bg-slate-800 rounded-md p-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleZoomOut}
            disabled={previewScale <= 50}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          <button
            onClick={handleZoomReset}
            className="px-2 py-1 text-xs font-medium text-slate-300 hover:text-white min-w-[48px]"
          >
            {previewScale}%
          </button>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleZoomIn}
            disabled={previewScale >= 150}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="text-xs text-slate-500">
          {previewDevice.charAt(0).toUpperCase() + previewDevice.slice(1)}: {baseWidth}px
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-8 flex items-start justify-center bg-[url('/grid.svg')]">
        <div
          className="transition-all duration-300 ease-out"
          style={{
            width: scaledWidth,
            height: "100%",
          }}
        >
          <iframe
            id="preview-frame"
            ref={iframeRef}
            src={`/preview/${project.id}${project.pages[0] ? `?page=${project.pages[0].id}` : ""}`}
            className={`w-full h-full bg-white rounded-lg shadow-2xl ${
              selectedSectionId ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-950" : ""
            }`}
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
}
