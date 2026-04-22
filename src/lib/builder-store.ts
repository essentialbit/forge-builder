import { create } from 'zustand';
import { Project, Page, Section, DeviceType } from '@/types/builder';
import { sectionRegistry } from '@/lib/section-registry';

export type PublishStage =
  | 'idle'
  | 'validating'
  | 'saving'
  | 'exporting'
  | 'pushing'
  | 'deploying'
  | 'success'
  | 'error';

export interface PublishState {
  stage: PublishStage;
  progress: number; // 0-100
  message: string;
  error?: string;
  deployUrl?: string;
  commitSha?: string;
  startedAt?: number;
  finishedAt?: number;
  logs: Array<{ t: number; level: 'info' | 'warn' | 'error'; msg: string }>;
}

export interface DeployConfig {
  githubRepo?: string; // e.g. "owner/repo"
  githubBranch?: string; // default "main"
  netlifySiteId?: string; // e.g. "5181df3b-..."
  customDomain?: string;
}

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
  publish: PublishState;
  deployConfig: DeployConfig;

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
  saveProject: () => Promise<boolean>;
  publishProject: () => Promise<void>;
  setDeployConfig: (config: Partial<DeployConfig>) => Promise<void>;
  resetPublishState: () => void;
  pingPreview: (payload: Record<string, unknown>) => void;
  getSections: () => Section[];
  getPageSections: (pageId: string) => Section[];
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const initialPublishState: PublishState = {
  stage: 'idle',
  progress: 0,
  message: '',
  logs: [],
};

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
  publish: initialPublishState,
  deployConfig: {},

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
        publish: initialPublishState,
        deployConfig: project.deployConfig ?? {},
      });
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  pingPreview: (payload) => {
    if (typeof window === 'undefined') return;
    const iframe = document.getElementById('preview-frame') as HTMLIFrameElement | null;
    iframe?.contentWindow?.postMessage(payload, '*');
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

    get().pingPreview({ type: 'RELOAD' });
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

    get().pingPreview({ type: 'RELOAD' });
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

    get().pingPreview({ type: 'RELOAD' });
  },

  setDragging: (isDragging) => set({ isDragging }),

  setPreviewDevice: (device) => set({ previewDevice: device }),

  setPreviewScale: (scale) => set({ previewScale: Math.max(50, Math.min(150, scale)) }),

  updateBrandKit: (updates) => {
    const { project, pingPreview } = get();
    if (!project) return;

    const newTheme = { ...project.theme, ...updates };
    set({
      project: {
        ...project,
        theme: newTheme,
        updated: new Date().toISOString(),
      },
      hasUnsavedChanges: true,
    });
    pingPreview({ type: 'THEME_UPDATE', theme: newTheme });
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
    if (!project) return false;

    set({ isSaving: true });
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Save failed (${response.status}): ${body.slice(0, 200)}`);
      }
      set({ hasUnsavedChanges: false });
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  setDeployConfig: async (updates) => {
    const { project } = get();
    if (!project) return;
    const merged = { ...get().deployConfig, ...updates };
    set({ deployConfig: merged });
    await fetch(`/api/projects/${project.id}/deploy-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    }).catch((e) => console.error('Failed to persist deploy config:', e));
  },

  resetPublishState: () => set({ publish: initialPublishState }),

  publishProject: async () => {
    const { project, saveProject, deployConfig } = get();
    if (!project) return;

    const started = Date.now();
    const logs: PublishState['logs'] = [];
    const log = (level: 'info' | 'warn' | 'error', msg: string) => {
      logs.push({ t: Date.now(), level, msg });
      // eslint-disable-next-line no-console
      (console[level === 'info' ? 'log' : level] as (m: string) => void)(`[publish] ${msg}`);
    };
    const update = (patch: Partial<PublishState>) =>
      set((s) => ({ publish: { ...s.publish, ...patch, logs: [...logs] } }));

    try {
      // 1) Validation
      update({ stage: 'validating', progress: 5, message: 'Validating project…', startedAt: started, error: undefined });
      log('info', `Publishing project "${project.name}" (${project.id})`);

      if (!project.pages || project.pages.length === 0) {
        throw new Error('Project has no pages. Add at least one page before publishing.');
      }
      const totalSections = project.pages.reduce((acc, p) => acc + p.sections.length, 0);
      if (totalSections === 0) {
        throw new Error('Project has no sections. Add at least one section before publishing.');
      }
      if (!deployConfig.githubRepo && !deployConfig.netlifySiteId) {
        log('warn', 'No deploy targets configured — publishing locally only.');
      }

      // 2) Save latest state
      update({ stage: 'saving', progress: 15, message: 'Saving project…' });
      const saved = await saveProject();
      if (!saved) throw new Error('Failed to save project before publish.');
      log('info', 'Saved project manifest to disk.');

      // 3) Export + push + deploy via server-side pipeline
      update({ stage: 'exporting', progress: 30, message: 'Exporting static site…' });

      const response = await fetch(`/api/projects/${project.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deployConfig }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'unknown' }));
        throw new Error(err.error || `Publish API returned ${response.status}`);
      }

      const result = await response.json();
      // Server returns per-stage results we can replay into logs
      (result.logs || []).forEach((l: PublishState['logs'][0]) => logs.push(l));

      if (result.github?.pushed) {
        update({ stage: 'pushing', progress: 60, message: 'Pushed to GitHub', commitSha: result.github.sha });
        log('info', `GitHub: pushed ${result.github.sha?.slice(0, 7)} to ${result.github.repo}@${result.github.branch}`);
      }
      if (result.netlify?.deployed) {
        update({
          stage: 'deploying',
          progress: 85,
          message: 'Netlify deploying…',
          deployUrl: result.netlify.url,
        });
        log('info', `Netlify: deploy ${result.netlify.deployId} state=${result.netlify.state}`);
      }

      update({
        stage: 'success',
        progress: 100,
        message: 'Published successfully',
        deployUrl: result.netlify?.url ?? result.localUrl,
        finishedAt: Date.now(),
      });

      set({
        project: {
          ...project,
          status: 'published',
          updated: new Date().toISOString(),
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log('error', msg);
      update({
        stage: 'error',
        message: 'Publish failed',
        error: msg,
        finishedAt: Date.now(),
      });
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
