"use client";

import { useEffect, useCallback, useState, useRef } from "react";
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
import { ForgeAssistant } from "@/components/builder/ForgeAssistant";
import { OnboardingChecklist } from "@/components/builder/OnboardingChecklist";
import { SeoPanel } from "@/components/builder/SeoPanel";
import { TemplateLibrary } from "@/components/builder/TemplateLibrary";
import { AgentPanel } from "@/components/ai/AgentPanel";
import { useAgentPanel } from "@/hooks/useAgentPanel";

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { loadProject, project, selectedSectionId, isLoading, hasUnsavedChanges, saveProject, autosaveEnabled } = useBuilderStore();
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [brandKitOpen, setBrandKitOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Agent panel state lives here so the toolbar can toggle it
  const agentPanel = useAgentPanel();

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

  // Autosave: save 3 seconds after last change
  useEffect(() => {
    if (!hasUnsavedChanges || !autosaveEnabled) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveProject();
    }, 3000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [hasUnsavedChanges, autosaveEnabled, saveProject]);

  // Keyboard shortcut: Cmd+I toggles AI panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        agentPanel.toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [agentPanel]);

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
            onTemplatesClick={() => setTemplateLibraryOpen(true)}
            aiPanelOpen={agentPanel.open}
            onAIPanelToggle={agentPanel.toggle}
          />

          {/* Main Content — 4-column layout when AI panel is open */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel — pages, sections, SEO tree */}
            <LeftPanel />

            {/* Canvas — shrinks to accommodate AI panel */}
            <div className="flex-1 relative min-w-0 overflow-hidden">
              <Canvas />
            </div>

            {/* Inspector / SEO Panel — always shown */}
            <div className={agentPanel.open ? "hidden xl:flex" : "flex"}>
              {selectedSectionId ? <Inspector /> : <SeoPanel />}
            </div>

            {/* AI Agent Panel — slides in from the right */}
            <AgentPanel
              open={agentPanel.open}
              onClose={agentPanel.close}
            />
          </div>

          {/* Brand Kit Modal */}
          <BrandKit open={brandKitOpen} onOpenChange={setBrandKitOpen} />

          {/* Publish Dialog */}
          <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} />

          {/* Template Library Modal */}
          {templateLibraryOpen && (
            <TemplateLibrary onClose={() => setTemplateLibraryOpen(false)} />
          )}
        </div>

        {/* Floating overlays — ForgeAssistant is the mini help/SAST button */}
        <ForgeAssistant />
        <OnboardingChecklist />
      </DnDProvider>
    </ErrorBoundary>
  );
}
