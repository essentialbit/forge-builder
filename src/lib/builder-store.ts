import { create } from 'zustand';
import { Project, Page, Section, DeviceType } from '@/types/builder';
import { sectionRegistry } from '@/lib/section-registry';

interface BuilderState {
  project: Project | null;
  selectedSectionId: string | null;
  selectedPageId: string | null;
  isDragging: boolean;
  previewDevice: DeviceType;
  previewScale: number;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  loadProject: (id: string) => Promise<void>;
  selectSection: (id: string | null) => void;
  selectPage: (id: string | null) => void;
  addSection: (pageId: string, type: string) => void;
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (pageId: string, fromIndex: number, toIndex: number) => void;
  setDragging: (isDragging: boolean) => void;
  setPreviewDevice: (device: DeviceType) => void;
  setPreviewScale: (scale: number) => void;
  updateBrandKit: (updates: Partial<Project['theme']>) => void;
  addPage: (name: string) => void;
  removePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  saveProject: () => Promise<void>;
  publishProject: () => Promise<void>;
  getSections: () => Section[];
  getPageSections: (pageId: string) => Section[];
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  project: null,
  selectedSectionId: null,
  selectedPageId: null,
  isDragging: false,
  previewDevice: 'desktop',
  previewScale: 100,
  hasUnsavedChanges: false,
  isLoading: false,
  isSaving: false,

  loadProject: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error('Failed to load project');
      const project = await response.json();
      set({
        project,
        selectedPageId: project.pages[0]?.id || null,
        selectedSectionId: null,
        hasUnsavedChanges: false,
      });
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  selectSection: (id) => set({ selectedSectionId: id }),

  selectPage: (id) => set({ selectedPageId: id, selectedSectionId: null }),

  addSection: (pageId, type) => {
    const { project } = get();
    if (!project) return;

    const definition = sectionRegistry[type];
    if (!definition) return;

    const newSection: Section = {
      id: generateId(type),
      type: definition.type,
      name: definition.name,
      settings: { ...definition.defaultSettings },
    };

    const updatedPages = project.pages.map((page) => {
      if (page.id === pageId) {
        return { ...page, sections: [...page.sections, newSection.id] };
      }
      return page;
    });

    set({
      project: {
        ...project,
        pages: updatedPages,
        sections: { ...(project.sections ?? {}), [newSection.id]: newSection },
        updated: new Date().toISOString(),
      },
      hasUnsavedChanges: true,
    });

    // Save section to file
    fetch(`/api/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, section: newSection }),
    });
  },

  updateSection: (sectionId, updates) => {
    const { project } = get();
    if (!project) return;

    const existing = project.sections?.[sectionId];
    if (!existing) return;

    const merged: Section = {
      ...existing,
      ...updates,
      settings: { ...existing.settings, ...(updates.settings ?? {}) },
    };

    set({
      project: {
        ...project,
        sections: { ...(project.sections ?? {}), [sectionId]: merged },
        updated: new Date().toISOString(),
      },
      hasUnsavedChanges: true,
    });

    // Persist updated section to disk
    fetch(`/api/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, section: merged }),
    }).catch(() => {});

    // Send update to preview
    if (typeof window !== 'undefined') {
      const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: 'SECTION_UPDATE', sectionId, updates },
          '*'
        );
      }
    }
  },

  removeSection: (sectionId) => {
    const { project, selectedSectionId } = get();
    if (!project) return;

    const updatedPages = project.pages.map((page) => ({
      ...page,
      sections: page.sections.filter((id) => id !== sectionId),
    }));

    const remainingSections = { ...(project.sections ?? {}) };
    delete remainingSections[sectionId];

    set({
      project: {
        ...project,
        pages: updatedPages,
        sections: remainingSections,
        updated: new Date().toISOString(),
      },
      selectedSectionId: selectedSectionId === sectionId ? null : selectedSectionId,
      hasUnsavedChanges: true,
    });
  },

  reorderSections: (pageId, fromIndex, toIndex) => {
    const { project } = get();
    if (!project) return;

    const updatedPages = project.pages.map((page) => {
      if (page.id === pageId) {
        const newSections = [...page.sections];
        const [removed] = newSections.splice(fromIndex, 1);
        newSections.splice(toIndex, 0, removed);
        return { ...page, sections: newSections };
      }
      return page;
    });

    set({
      project: {
        ...project,
        pages: updatedPages,
        updated: new Date().toISOString(),
      },
      hasUnsavedChanges: true,
    });
  },

  setDragging: (isDragging) => set({ isDragging }),

  setPreviewDevice: (device) => set({ previewDevice: device }),

  setPreviewScale: (scale) => set({ previewScale: Math.max(50, Math.min(150, scale)) }),

  updateBrandKit: (updates) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        theme: { ...project.theme, ...updates },
        updated: new Date().toISOString(),
      },
      hasUnsavedChanges: true,
    });
  },

  addPage: (name) => {
    const { project } = get();
    if (!project) return;

    const newPage: Page = {
      id: generateId('page'),
      name,
      slug: `/${name.toLowerCase().replace(/\s+/g, '-')}`,
      sections: [],
    };

    set({
      project: {
        ...project,
        pages: [...project.pages, newPage],
        updated: new Date().toISOString(),
      },
      selectedPageId: newPage.id,
      hasUnsavedChanges: true,
    });
  },

  removePage: (pageId) => {
    const { project, selectedPageId } = get();
    if (!project || project.pages.length <= 1) return;

    const updatedPages = project.pages.filter((p) => p.id !== pageId);

    set({
      project: {
        ...project,
        pages: updatedPages,
        updated: new Date().toISOString(),
      },
      selectedPageId: selectedPageId === pageId ? updatedPages[0].id : selectedPageId,
      hasUnsavedChanges: true,
    });
  },

  renamePage: (pageId, name) => {
    const { project } = get();
    if (!project) return;

    const updatedPages = project.pages.map((page) =>
      page.id === pageId ? { ...page, name } : page
    );

    set({
      project: {
        ...project,
        pages: updatedPages,
        updated: new Date().toISOString(),
      },
      hasUnsavedChanges: true,
    });
  },

  saveProject: async () => {
    const { project } = get();
    if (!project) return;

    set({ isSaving: true });
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error('Failed to save project');
      set({ hasUnsavedChanges: false });
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      set({ isSaving: false });
    }
  },

  publishProject: async () => {
    const { project, saveProject } = get();
    if (!project) return;

    await saveProject();

    try {
      const response = await fetch(`/api/projects/${project.id}/publish`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to publish project');

      set({
        project: {
          ...project,
          status: 'published',
          updated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to publish project:', error);
    }
  },

  getSections: () => {
    const { project } = get();
    if (!project) return [];
    const dict = project.sections ?? {};
    return project.pages
      .flatMap((page) => page.sections)
      .map((id) => dict[id])
      .filter((s): s is Section => Boolean(s));
  },

  getPageSections: (pageId) => {
    const { project } = get();
    if (!project) return [];

    const page = project.pages.find((p) => p.id === pageId);
    if (!page) return [];

    const dict = project.sections ?? {};
    return page.sections
      .map((id) => dict[id])
      .filter((s): s is Section => Boolean(s));
  },
}));
