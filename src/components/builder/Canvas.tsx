"use client";

import { useRef, useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/builder-store";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const deviceWidths = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

export function Canvas() {
  const { project, previewDevice, previewScale, setPreviewScale, selectedSectionId, selectedPageId } = useBuilderStore();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(900);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const baseWidth = deviceWidths[previewDevice];
  const scaledWidth = (baseWidth * previewScale) / 100;

  // Reset when page/project changes
  useEffect(() => {
    setIframeLoaded(false);
    setIframeHeight(900);
  }, [project?.id, previewDevice, selectedPageId]);

  // Listen for content height reports from the preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "CONTENT_HEIGHT" && typeof e.data.height === "number") {
        setIframeHeight(Math.max(700, e.data.height + 40));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleIframeLoad = () => setIframeLoaded(true);
  const handleZoomIn = () => setPreviewScale(Math.min(150, previewScale + 10));
  const handleZoomOut = () => setPreviewScale(Math.max(50, previewScale - 10));
  const handleZoomReset = () => setPreviewScale(100);

  if (!project) return null;

  const previewSrc = `/preview/${project.id}${
    selectedPageId
      ? `?page=${selectedPageId}`
      : project.pages[0]
      ? `?page=${project.pages[0].id}`
      : ""
  }`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0a0f1a' }}>
      {/* ── Zoom Controls ─────────────────────────────────────────────── */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-center gap-4 px-4 flex-shrink-0">
        <div className="flex items-center gap-1 bg-slate-800 rounded-md p-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-400 hover:text-white"
            onClick={handleZoomOut}
            disabled={previewScale <= 50}
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          <button
            onClick={handleZoomReset}
            className="px-2 py-1 text-xs font-medium text-slate-300 hover:text-white min-w-[48px] transition-colors"
            title="Reset zoom"
          >
            {previewScale}%
          </button>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-400 hover:text-white"
            onClick={handleZoomIn}
            disabled={previewScale >= 150}
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="text-xs text-slate-500">
          {previewDevice.charAt(0).toUpperCase() + previewDevice.slice(1)}: {baseWidth}px
          {iframeHeight > 900 && (
            <span className="ml-2 text-slate-600">· {Math.round(iframeHeight)}px tall</span>
          )}
        </div>
      </div>

      {/* ── Scrollable Preview Area ────────────────────────────────────
          overflow-auto on this div allows vertical + horizontal scrolling.
          The iframe wrapper does NOT use height:100%, so the iframe can
          grow beyond the viewport and the outer div scrolls to reveal it.
      ──────────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-auto"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.06) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="min-h-full py-6 px-6 flex items-start justify-center">
          <div
            className="transition-all duration-300 ease-out flex-shrink-0 relative"
            style={{ width: scaledWidth }}
          >
            {/* Loading skeleton */}
            {!iframeLoaded && (
              <div
                className="w-full bg-slate-800/60 rounded-xl animate-pulse border border-slate-700/40"
                style={{ height: iframeHeight }}
              >
                <div className="p-8 space-y-4">
                  <div className="h-8 bg-slate-700/60 rounded-lg w-2/3 mx-auto" />
                  <div className="h-4 bg-slate-700/40 rounded w-1/2 mx-auto" />
                  <div className="h-64 bg-slate-700/30 rounded-lg mt-8" />
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-700/20 rounded-lg" />)}
                  </div>
                </div>
              </div>
            )}

            {/* The iframe — height is dynamically set from CONTENT_HEIGHT messages */}
            <iframe
              id="preview-frame"
              ref={iframeRef}
              src={previewSrc}
              className={`w-full bg-white rounded-xl shadow-2xl block transition-opacity duration-300 ${
                iframeLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
              } ${
                selectedSectionId
                  ? "ring-2 ring-amber-500 ring-offset-4 ring-offset-[#0a0f1a]"
                  : ""
              }`}
              style={{ height: iframeHeight }}
              onLoad={handleIframeLoad}
              title="Page Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
