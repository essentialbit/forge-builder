import { create } from 'zustand';
import { Project, Page, Section, DeviceType, Block, BlockType } from '@/types/builder';
import { sectionRegistry } from '@/lib/section-registry';
import { blockRegistry } from '@/lib/block-registry';
import { cloneProject } from '@/lib/history-middleware';
import { normalizeTheme } from '@/lib/theme';

const MAX_HISTORY = 50;

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
  // History
  _past: Project[];
  _future: Project[];
  // Autosave
  autosaveEnabled: boolean;
  lastSavedAt: number | null;

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

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  updatePageSeo: (pageId: string, seo: { title?: string; description?: string; ogImage?: string }) => void;

  // Extra mutations
  duplicateSection: (sectionId: string) => void;
  moveSection: (sectionId: string, delta: number) => void;

  // Block-level mutations (all record history)
  addBlock: (sectionId: string, blockType: string) => void;
  updateBlock: (sectionId: string, blockId: string, updates: Partial<Block>) => void;
  removeBlock: (sectionId: string, blockId: string) => void;
  reorderBlocks: (sectionId: string, fromIndex: number, toIndex: number) => void;
  duplicateBlock: (sectionId: string, blockId: string) => void;

  // Template library
  applyTemplate: (pageId: string, templateSections: Omit<Section, 'id'>[]) => void;
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

// Helper: snapshot current project into _past before a mutating action
function recordHistory(
  get: () => BuilderState,
  set: (partial: Partial<BuilderState>) => void,
) {
  const state = get();
  if (!state.project) return;
  const snap = cloneProject(state.project);
  set({
    _past: [...state._past.slice(-MAX_HISTORY + 1), snap],
    _future: [],
  });
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
  _past: [],
  _future: [],
  autosaveEnabled: true,
  lastSavedAt: null,
  isSaving: false,
  publish: initialPublishState,
  deployConfig: {},

  loadProject: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error('Failed to load project');
      const project = await response.json();
      project.theme = normalizeTheme(project.theme);
      set({
        project,
        selectedPageId: project.pages[0]?.id || null,
        selectedSectionId: null,
        hasUnsavedChanges: false,
        publish: initialPublishState,
        deployConfig: project.deployConfig ?? {},
        _past: [],
        _future: [],
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
    recordHistory(get, set);

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
    recordHistory(get, set);

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
    recordHistory(get, set);

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
    recordHistory(get, set);

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
    recordHistory(get, set);

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
    recordHistory(get, set);

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
    recordHistory(get, set);

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
    recordHistory(get, set);

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
      set({ hasUnsavedChanges: false, lastSavedAt: Date.now() });
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

  // --- History ---
  undo: () => {
    const state = get();
    const past = state._past;
    if (past.length === 0 || !state.project) return;
    const prev = past[past.length - 1];
    const current = cloneProject(state.project);
    set({
      project: prev,
      _past: past.slice(0, -1),
      _future: [current, ...state._future].slice(0, MAX_HISTORY),
      hasUnsavedChanges: true,
    });
    get().pingPreview({ type: 'RELOAD' });
  },
  redo: () => {
    const state = get();
    const future = state._future;
    if (future.length === 0 || !state.project) return;
    const next = future[0];
    const current = cloneProject(state.project);
    set({
      project: next,
      _future: future.slice(1),
      _past: [...state._past, current].slice(-MAX_HISTORY),
      hasUnsavedChanges: true,
    });
    get().pingPreview({ type: 'RELOAD' });
  },
  canUndo: () => get()._past.length > 0,
  canRedo: () => get()._future.length > 0,

  // --- Extra mutations ---
  duplicateSection: (sectionId) => {
    const { project } = get();
    if (!project) return;
    const section = project.sections?.[sectionId];
    if (!section) return;
    recordHistory(get, set);

    // Find the page containing this section
    let foundPageId: string | null = null;
    let insertIdx = -1;
    for (const page of project.pages) {
      const i = page.sections.indexOf(sectionId);
      if (i >= 0) {
        foundPageId = page.id;
        insertIdx = i;
        break;
      }
    }
    if (!foundPageId) return;

    const newId = generateId(section.type);
    const copy: Section = {
      ...cloneProject({ ...section } as unknown as Project) as unknown as Section,
      id: newId,
      name: `${section.name} (copy)`,
    };

    const updatedPages = project.pages.map((page) =>
      page.id === foundPageId
        ? {
            ...page,
            sections: [
              ...page.sections.slice(0, insertIdx + 1),
              newId,
              ...page.sections.slice(insertIdx + 1),
            ],
          }
        : page,
    );

    set({
      project: {
        ...project,
        pages: updatedPages,
        sections: { ...(project.sections ?? {}), [newId]: copy },
        updated: new Date().toISOString(),
      },
      selectedSectionId: newId,
      hasUnsavedChanges: true,
    });

    fetch(`/api/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, section: copy }),
    }).catch(() => {});

    get().pingPreview({ type: 'RELOAD' });
  },

  // --- SEO ---
  updatePageSeo: (pageId, seo) => {
    const { project } = get();
    if (!project) return;
    const updatedPages = project.pages.map((page) =>
      page.id === pageId ? { ...page, seo: { ...page.seo, ...seo } } : page
    );
    set({
      project: { ...project, pages: updatedPages, updated: new Date().toISOString() },
      hasUnsavedChanges: true,
    });
  },

  // --- Block mutations ---
  addBlock: (sectionId, blockType) => {
    const { project } = get();
    if (!project) return;
    const section = project.sections?.[sectionId];
    if (!section) return;
    recordHistory(get, set);
    const def = blockRegistry[blockType];
    if (!def) return;
    const newBlock: Block = {
      id: generateId('blk'),
      type: blockType as BlockType,
      settings: { ...def.defaultSettings },
    };
    const blocks = [...(section.blocks ?? []), newBlock];
    get().updateSection(sectionId, { blocks });
  },

  updateBlock: (sectionId, blockId, updates) => {
    const { project } = get();
    if (!project) return;
    const section = project.sections?.[sectionId];
    if (!section) return;
    recordHistory(get, set);
    const blocks = (section.blocks ?? []).map((b) =>
      b.id === blockId ? { ...b, ...updates, settings: { ...b.settings, ...((updates as { settings?: Record<string, unknown> }).settings ?? {}) } } : b
    );
    get().updateSection(sectionId, { blocks });
  },

  removeBlock: (sectionId, blockId) => {
    const { project } = get();
    if (!project) return;
    const section = project.sections?.[sectionId];
    if (!section) return;
    recordHistory(get, set);
    const blocks = (section.blocks ?? []).filter((b) => b.id !== blockId);
    get().updateSection(sectionId, { blocks });
  },

  reorderBlocks: (sectionId, fromIndex, toIndex) => {
    const { project } = get();
    if (!project) return;
    const section = project.sections?.[sectionId];
    if (!section) return;
    recordHistory(get, set);
    const blocks = [...(section.blocks ?? [])];
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);
    get().updateSection(sectionId, { blocks });
  },

  duplicateBlock: (sectionId, blockId) => {
    const { project } = get();
    if (!project) return;
    const section = project.sections?.[sectionId];
    if (!section) return;
    const blocks = section.blocks ?? [];
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    recordHistory(get, set);
    const src = blocks[idx];
    const newBlock: Block = {
      id: generateId('blk'),
      type: src.type,
      settings: { ...src.settings },
    };
    const newBlocks = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
    get().updateSection(sectionId, { blocks: newBlocks });
  },

  moveSection: (sectionId, delta) => {
    const { project } = get();
    if (!project) return;
    for (const page of project.pages) {
      const i = page.sections.indexOf(sectionId);
      if (i >= 0) {
        const target = i + delta;
        if (target < 0 || target >= page.sections.length) return;
        get().reorderSections(page.id, i, target);
        return;
      }
    }
  },

  /**
   * applyTemplate — stamps a template's section list onto a page.
   * Replaces ALL existing sections on the page with the template's sections.
   * Records history so the user can undo if they applied by mistake.
   */
  applyTemplate: (pageId, templateSections) => {
    const { project } = get();
    if (!project) return;
    recordHistory(get, set);

    // Build new Section objects from the template definitions
    const newSections: Section[] = templateSections.map((tplSection) => ({
      ...tplSection,
      id: generateId(tplSection.type),
    }));

    // Replace the page's section list
    const updatedPages = project.pages.map((page) => {
      if (page.id !== pageId) return page;
      return { ...page, sections: newSections.map((s) => s.id) };
    });

    // Remove old sections for this page from the sections map,
    // then add the new ones
    const oldPageSections = project.pages.find((p) => p.id === pageId)?.sections ?? [];
    const remainingSections = { ...(project.sections ?? {}) };
    for (const id of oldPageSections) delete remainingSections[id];
    for (const s of newSections) remainingSections[s.id] = s;

    set({
      project: {
        ...project,
        pages: updatedPages,
        sections: remainingSections,
        updated: new Date().toISOString(),
      },
      hasUnsavedChanges: true,
      selectedSectionId: null,
    });

    get().pingPreview({ type: 'RELOAD' });
  },
}));
