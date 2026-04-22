"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Project, Section } from "@/types/builder";
import { SectionRenderer } from "@/components/builder/SectionRenderer";

export default function PreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const pageId = searchParams.get("page");

  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadPreview() {
      try {
        const [projectData, sectionsData] = await Promise.all([
          getProjectData(projectId),
          getSectionsData(projectId),
        ]);
        setProject(projectData);
        setSections(sectionsData);
      } catch (error) {
        console.error("Failed to load preview:", error);
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadPreview();
    }
  }, [projectId, reloadKey]);

  // Listen for updates from builder
  const handleMessage = useCallback((event: MessageEvent) => {
    const { type, sectionId, updates, theme } = event.data || {};

    if (type === "SECTION_UPDATE" && sectionId) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, settings: { ...s.settings, ...(updates?.settings ?? {}) } }
            : s
        )
      );
    }

    if (type === "THEME_UPDATE" && theme) {
      setProject((prev) => (prev ? { ...prev, theme: { ...prev.theme, ...theme } } : prev));
    }

    if (type === "RELOAD") {
      reload();
    }
  }, [reload]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Notify builder when section is clicked
  const handleSectionClick = (sectionId: string) => {
    window.parent.postMessage({ type: "SECTION_CLICKED", sectionId }, "*");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  // Get the current page
  const currentPage = pageId
    ? project.pages.find((p) => p.id === pageId)
    : project.pages[0];

  if (!currentPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Page not found</p>
      </div>
    );
  }

  // Get sections for this page
  const pageSections = currentPage.sections
    .map((sectionId) => sections.find((s) => s.id === sectionId))
    .filter(Boolean) as Section[];

  return (
    <div className="min-h-screen bg-white">
      {pageSections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          theme={project.theme}
          isEditing={true}
          onSelect={() => handleSectionClick(section.id)}
        />
      ))}

      {pageSections.length === 0 && (
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No sections on this page</p>
            <p className="text-sm">Add sections from the builder editor</p>
          </div>
        </div>
      )}
    </div>
  );
}

async function getProjectData(projectId: string): Promise<Project | null> {
  try {
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getSectionsData(projectId: string): Promise<Section[]> {
  try {
    const res = await fetch(`/api/sections?projectId=${encodeURIComponent(projectId)}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
