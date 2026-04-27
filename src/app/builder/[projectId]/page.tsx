"use client";

import { useEffect, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { useBuilderStore } from "@/lib/builder-store";
import { Toolbar } from "@/components/builder/Toolbar";
import { LeftPanel } from "@/components/builder/LeftPanel";
import { Canvas } from "@/components/builder/Canvas";
import { Inspector } from "@/components/builder/Inspector";
import { BrandKit } from "@/components/builder/BrandKit";
import { DnDProvider } from "@/components/builder/DnDContext";
import { PublishDialog } from "@/components/builder/PublishDialog";
import { KeyboardShortcuts } from "@/components/builder/KeyboardShortcuts";
import { CommandPalette } from "@/components/builder/CommandPalette";
import { ErrorBoundary } from "@/components/builder/ErrorBoundary";

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { loadProject, project, selectedSectionId, isLoading } = useBuilderStore();
  const [brandKitOpen, setBrandKitOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth check — redirect to login if not authenticated
  useEffect(() => {
    const user = getCurrentUserFromCookie();
    if (!user) {
      router.replace(`/login?redirect=/builder/${projectId}`);
    } else {
      setAuthChecked(true);
    }
  }, [projectId, router]);

  useEffect(() => {
    if (!authChecked) return;
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject, authChecked]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const { type, sectionId } = event.data;
      if (type === "SECTION_CLICKED") {
        useBuilderStore.getState().selectSection(sectionId);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Auth loading state
  if (!authChecked) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Checking session…</p>
        </div>
      </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading project…</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DnDProvider>
        <KeyboardShortcuts />
        <CommandPalette />
        <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
          {/* Top Toolbar */}
          <Toolbar
            onBrandKitClick={() => setBrandKitOpen(true)}
            onPublishClick={() => setPublishOpen(true)}
          />

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel */}
            <LeftPanel />

            {/* Canvas */}
            <div className="flex-1 relative">
              <Canvas />
            </div>

            {/* Right Panel - Inspector */}
            {selectedSectionId && <Inspector />}
          </div>

          {/* Brand Kit Modal */}
          <BrandKit open={brandKitOpen} onOpenChange={setBrandKitOpen} />

          {/* Publish Dialog */}
          <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} />
        </div>
      </DnDProvider>
    </ErrorBoundary>
  );
}
