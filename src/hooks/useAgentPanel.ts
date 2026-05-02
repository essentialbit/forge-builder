/**
 * Forge Builder — useAgentPanel hook
 *
 * Manages the AI agent panel state and executes tool calls against the
 * builder store. This is where the "AI acts on the page" capability lives.
 *
 * Architecture:
 *   1. User sends message
 *   2. We call /api/ai/agent with conversation + project snapshot
 *   3. API streams back tokens + final AgentResponse (with actions[])
 *   4. We execute each action against useBuilderStore (client-side)
 *   5. Canvas updates live as actions run
 *   6. If a search_web action is present, we call /api/ai/search,
 *      inject the result into context, and re-call the agent
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useBuilderStore } from '@/lib/builder-store';
import { snapshotProject } from '@/lib/ai/builder-tools';
import type { AgentResponse, ToolCall, ToolResult } from '@/lib/ai/builder-tools';
import type { ChatMessage } from '@/lib/ai/types';

export type AgentMessageRole = 'user' | 'assistant' | 'system' | 'tool-result';

// ── Proactive fix approval types ──────────────────────────────────────────

export interface PendingFix {
  id: string;
  title: string;             // "Add meta title to Homepage"
  description: string;       // longer explanation
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;          // 'seo' | 'accessibility' | 'conversion' | etc.
  toolCall: ToolCall;        // The actual fix to execute
  status: 'pending' | 'approved' | 'skipped' | 'executing' | 'done' | 'failed';
  result?: ToolResult;
}

export interface FixApprovalState {
  fixes: PendingFix[];
  mode: 'all' | 'review';      // fix all at once vs review one-by-one
  currentIndex: number;         // for review mode
  alwaysApprove: boolean;       // skip remaining confirmations
  completedCount: number;
  skippedCount: number;
}

export interface AgentMessage {
  id: string;
  role: AgentMessageRole;
  content: string;
  timestamp: number;
  actions?: ToolCall[];         // Actions the AI took
  isStreaming?: boolean;
  thoughts?: string;
  error?: boolean;
  fixApproval?: FixApprovalState; // Proactive fix approval UI
}

export type AgentPhase =
  | 'idle'
  | 'thinking'
  | 'executing'                 // Running tool calls
  | 'searching'                 // Web search in progress
  | 'approving'                 // Waiting for user to approve fixes
  | 'done';

function genId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useAgentPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [streamBuffer, setStreamBuffer] = useState('');
  const [executionLog, setExecutionLog] = useState<ToolCall[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const store = useBuilderStore();

  // ── Open/close ────────────────────────────────────────────────────────

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  // ── Tool executor ─────────────────────────────────────────────────────
  // Runs a single tool call against the builder store and returns a result.

  const executeTool = useCallback(async (call: ToolCall): Promise<ToolResult> => {
    const { tool, params } = call;

    try {
      switch (tool) {

        case 'add_section': {
          const { pageId, sectionType, position } = params as {
            pageId: string; sectionType: string; position?: number;
          };
          const resolvedPageId = resolvePageId(pageId);
          if (!resolvedPageId) return { success: false, message: `Page "${pageId}" not found` };
          store.addSection(resolvedPageId, sectionType);
          // If position specified, we need to move it (addSection appends)
          if (position !== undefined) {
            // Get fresh state after addSection
            const sections = useBuilderStore.getState().getPageSections(resolvedPageId);
            if (sections.length > 1) {
              const newSectionId = sections[sections.length - 1].id;
              const fromIdx = sections.length - 1;
              const toIdx = Math.max(0, Math.min(position, sections.length - 1));
              if (fromIdx !== toIdx) {
                store.reorderSections(resolvedPageId, fromIdx, toIdx);
              }
              return { success: true, message: `Added "${sectionType}" section`, data: { sectionId: newSectionId } };
            }
          }
          return { success: true, message: `Added "${sectionType}" section to "${pageId}"` };
        }

        case 'update_section': {
          const { sectionId, settings } = params as { sectionId: string; settings: Record<string, unknown> };
          const resolvedId = resolveSectionId(sectionId);
          if (!resolvedId) return { success: false, message: `Section "${sectionId}" not found` };
          store.updateSection(resolvedId, { settings });
          return { success: true, message: `Updated section settings` };
        }

        case 'remove_section': {
          const { sectionId } = params as { sectionId: string };
          const resolvedId = resolveSectionId(sectionId);
          if (!resolvedId) return { success: false, message: `Section "${sectionId}" not found` };
          store.removeSection(resolvedId);
          return { success: true, message: `Removed section` };
        }

        case 'duplicate_section': {
          const { sectionId } = params as { sectionId: string };
          const resolvedId = resolveSectionId(sectionId);
          if (!resolvedId) return { success: false, message: `Section "${sectionId}" not found` };
          // Use the store's built-in duplicateSection — it handles ID generation and settings copy
          store.duplicateSection(resolvedId);
          // The store sets selectedSectionId to the new section after duplication
          const newId = useBuilderStore.getState().selectedSectionId;
          return { success: true, message: `Duplicated section`, data: { sectionId: newId } };
        }

        case 'reorder_section': {
          const { pageId, sectionId, direction } = params as {
            pageId?: string; sectionId: string; direction: 'up' | 'down';
          };
          const resolvedPageId = pageId ? resolvePageId(pageId) : store.selectedPageId;
          if (!resolvedPageId) return { success: false, message: 'No active page' };
          // Use store.moveSection(sectionId, delta) — simpler than manual index math
          const delta = direction === 'up' ? -1 : 1;
          store.moveSection(sectionId, delta);
          return { success: true, message: `Moved section ${direction}` };
        }

        case 'update_brand_kit': {
          const { theme } = params as { theme: Record<string, unknown> };
          store.updateBrandKit(theme as Parameters<typeof store.updateBrandKit>[0]);
          return { success: true, message: `Updated brand kit` };
        }

        case 'add_page': {
          const { name, path } = params as { name: string; path?: string };
          store.addPage(name);
          // path is handled by default convention — TODO: expose path setter in store
          void path;
          return { success: true, message: `Added page "${name}"` };
        }

        case 'select_section': {
          const { sectionId } = params as { sectionId: string };
          const resolvedId = resolveSectionId(sectionId);
          if (!resolvedId) return { success: false, message: `Section not found` };
          store.selectSection(resolvedId);
          return { success: true, message: `Selected section` };
        }

        case 'set_seo': {
          const { pageId, title, description, ogImage } = params as {
            pageId: string; title?: string; description?: string; ogImage?: string;
          };
          const resolvedId = resolvePageId(pageId);
          if (!resolvedId) return { success: false, message: `Page not found` };
          // The store has updatePageSeo — use it directly
          store.updatePageSeo(resolvedId, { title, description, ogImage });
          return { success: true, message: `Updated SEO for "${pageId}"` };
        }

        case 'generate_content': {
          const { sectionType, brief } = params as { sectionType: string; brief: string };
          const res = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sectionType, prompt: brief }),
          });
          if (!res.ok) return { success: false, message: 'Content generation failed' };
          const data = (await res.json()) as { settings: Record<string, unknown> };
          return { success: true, message: `Generated content for "${sectionType}"`, data: data.settings };
        }

        case 'search_web': {
          const { query } = params as { query: string };
          const res = await fetch('/api/ai/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });
          if (!res.ok) return { success: false, message: 'Search failed' };
          const data = (await res.json()) as { summary: string; sources: string[]; offline?: boolean };
          return {
            success: true,
            message: data.offline ? 'Offline — using built-in knowledge' : `Found information about "${query}"`,
            data: { summary: data.summary, sources: data.sources },
          };
        }

        default:
          return { success: false, message: `Unknown tool: ${tool}` };
      }
    } catch (e) {
      return { success: false, message: `Tool error: ${(e as Error).message}` };
    }
  }, [store]);

  // ── Main send function ────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || phase !== 'idle') return;

    const userMsg: AgentMessage = {
      id: genId(), role: 'user', content: content.trim(), timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setPhase('thinking');
    setStreamBuffer('');
    setExecutionLog([]);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = genId();
    // Add placeholder streaming message
    setMessages((prev) => [...prev, {
      id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true,
    }]);

    try {
      // Build conversation history (exclude streaming placeholders)
      const history: ChatMessage[] = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .filter((m) => !m.isStreaming && m.content)
        .map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content, timestamp: m.timestamp }));

      history.push({ id: userMsg.id, role: 'user', content: userMsg.content, timestamp: userMsg.timestamp });

      // Snapshot current project state
      const snapshot = snapshotProject(store.project, store.selectedPageId);

      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, project: snapshot, stream: true }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = '';
      let finalResponse: AgentResponse | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            const event = JSON.parse(payload) as {
              type: 'thinking' | 'token' | 'complete' | 'error';
              content?: string;
              response?: AgentResponse;
            };

            if (event.type === 'thinking') {
              setPhase('thinking');
            } else if (event.type === 'token' && event.content) {
              streamedText += event.content;
              setStreamBuffer(streamedText);
              // Live-update the streaming message
              setMessages((prev) => prev.map((m) =>
                m.id === assistantId ? { ...m, content: streamedText } : m
              ));
            } else if (event.type === 'complete' && event.response) {
              finalResponse = event.response;
            } else if (event.type === 'error') {
              throw new Error(event.content);
            }
          } catch {
            // skip unparseable SSE lines
          }
        }
      }

      // ── Execute tool calls ────────────────────────────────────────────
      if (finalResponse && finalResponse.actions.length > 0) {
        setPhase('executing');
        const executedActions: ToolCall[] = [];

        for (const action of finalResponse.actions) {
          // Handle search specially — re-inject result into conversation
          if (action.tool === 'search_web') {
            setPhase('searching');
          }

          const result = await executeTool(action);
          const withResult = { ...action, result };
          executedActions.push(withResult);
          setExecutionLog((prev) => [...prev, withResult]);

          // If search returned data, chain it back to the agent
          if (action.tool === 'search_web' && result.success && result.data) {
            const searchData = result.data as { summary: string; sources: string[] };
            const searchContext: ChatMessage = {
              id: genId(),
              role: 'user',
              content: `[Search result for "${(action.params as { query: string }).query}"]\n${searchData.summary}${searchData.sources.length ? `\n\nSources: ${searchData.sources.join(', ')}` : ''}`,
              timestamp: Date.now(),
            };
            // Continue the conversation with the search result
            history.push(searchContext);
          }

          // If generate_content returned settings, auto-apply them to the most recently added section
          if (action.tool === 'generate_content' && result.success && result.data) {
            const prevAddSection = executedActions.find((a) => a.tool === 'add_section' && a.result?.success);
            if (prevAddSection?.result?.data) {
              const addData = prevAddSection.result.data as { sectionId?: string };
              // Use getSections() — returns Section[] with proper types
              const allSections = useBuilderStore.getState().getSections();
              const newest = allSections.at(-1);
              if (newest && addData.sectionId !== newest.id) {
                store.updateSection(newest.id, { settings: result.data as Record<string, unknown> });
              }
            }
          }
        }

        // Finalize the message with actions attached
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: finalResponse!.message,
                actions: executedActions,
                thoughts: finalResponse!.thoughts,
                isStreaming: false,
              }
            : m
        ));
      } else {
        // Plain message, no actions
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: finalResponse?.message ?? streamedText,
                thoughts: finalResponse?.thoughts,
                isStreaming: false,
              }
            : m
        ));
      }

    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setPhase('idle');
        return;
      }
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId
          ? { ...m, content: `Something went wrong: ${(e as Error).message}`, isStreaming: false, error: true }
          : m
      ));
    } finally {
      setStreamBuffer('');
      setPhase('idle');
    }
  }, [phase, messages, store, executeTool]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setPhase('idle');
    setStreamBuffer('');
    // Mark last message as complete
    setMessages((prev) => prev.map((m, i) =>
      i === prev.length - 1 && m.isStreaming ? { ...m, isStreaming: false } : m
    ));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setExecutionLog([]);
  }, []);

  // ── Proactive Analysis + Fix Approval ────────────────────────────────────

  /**
   * Run site analysis and propose fixes with approval workflow.
   * Called when user clicks "Analyse & Fix" or after certain triggers.
   */
  const analyzeAndProposeFixes = useCallback(async () => {
    if (phase !== 'idle') return;
    setPhase('thinking');

    const analysisId = genId();
    setMessages((prev) => [...prev, {
      id: analysisId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    }]);

    try {
      // Run analysis
      const snapshot = snapshotProject(store.project, store.selectedPageId);
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: snapshot }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = (await res.json()) as {
        score: number;
        summary: string;
        sast: Array<{ id: string; severity: string; category: string; message: string; recommendation: string; sectionType?: string }>;
        drift: Array<{ id: string; severity: string; message: string; sectionType: string; field: string }>;
        suggestions: Array<{ id: string; type: string; title: string; description: string; priority: number }>;
      };

      // Build fix proposals from findings
      const fixes: PendingFix[] = [];

      // Map SAST findings → tool calls
      for (const finding of data.sast ?? []) {
        if (finding.severity === 'critical' || finding.severity === 'high' || finding.severity === 'medium') {
          const toolCall = mapFindingToToolCall(finding);
          if (toolCall) {
            fixes.push({
              id: finding.id ?? genId(),
              title: finding.message,
              description: finding.recommendation,
              severity: finding.severity as PendingFix['severity'],
              category: finding.category,
              toolCall,
              status: 'pending',
            });
          }
        }
      }

      // Map auto-suggestions → tool calls
      for (const sug of (data.suggestions ?? []).slice(0, 3)) {
        const toolCall = mapSuggestionToToolCall(sug);
        if (toolCall) {
          fixes.push({
            id: sug.id ?? genId(),
            title: sug.title,
            description: sug.description,
            severity: sug.priority <= 1 ? 'high' : sug.priority <= 2 ? 'medium' : 'low',
            category: sug.type,
            toolCall,
            status: 'pending',
          });
        }
      }

      const scoreLabel = data.score >= 90 ? '🟢' : data.score >= 70 ? '🟡' : '🔴';
      const summaryText = fixes.length > 0
        ? `${scoreLabel} Site score: **${data.score}/100**\n\n${data.summary}\n\nI found **${fixes.length} issue${fixes.length !== 1 ? 's' : ''}** I can automatically fix. How would you like to proceed?`
        : `${scoreLabel} Site score: **${data.score}/100**\n\n${data.summary}\n\nNo critical issues found that I can auto-fix right now. Your site is looking good!`;

      setMessages((prev) => prev.map((m) =>
        m.id === analysisId
          ? {
              ...m,
              content: summaryText,
              isStreaming: false,
              fixApproval: fixes.length > 0 ? {
                fixes,
                mode: 'all',
                currentIndex: 0,
                alwaysApprove: false,
                completedCount: 0,
                skippedCount: 0,
              } : undefined,
            }
          : m
      ));

      setPhase('idle');

    } catch (e) {
      setMessages((prev) => prev.map((m) =>
        m.id === analysisId
          ? { ...m, content: `Analysis failed: ${(e as Error).message}`, isStreaming: false, error: true }
          : m
      ));
      setPhase('idle');
    }
  }, [phase, store]);

  /**
   * Approve and execute a single fix (review mode).
   */
  const approveFix = useCallback(async (messageId: string, fixId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.fixApproval) return;

    const fa = msg.fixApproval;
    const fix = fa.fixes.find((f) => f.id === fixId);
    if (!fix) return;

    // Mark as executing
    updateFix(messageId, fixId, { status: 'executing' });
    setPhase('executing');

    try {
      const result = await executeTool(fix.toolCall);
      updateFix(messageId, fixId, { status: result.success ? 'done' : 'failed', result });

      setMessages((prev) => prev.map((m) =>
        m.id === messageId && m.fixApproval
          ? {
              ...m,
              fixApproval: {
                ...m.fixApproval,
                completedCount: m.fixApproval.completedCount + (result.success ? 1 : 0),
                currentIndex: m.fixApproval.currentIndex + 1,
              },
            }
          : m
      ));
    } catch (e) {
      updateFix(messageId, fixId, { status: 'failed', result: { success: false, message: (e as Error).message } });
    } finally {
      setPhase('idle');
    }
  }, [messages, executeTool]);

  /**
   * Skip a single fix (review mode).
   */
  const skipFix = useCallback((messageId: string, fixId: string) => {
    updateFix(messageId, fixId, { status: 'skipped' });
    setMessages((prev) => prev.map((m) =>
      m.id === messageId && m.fixApproval
        ? {
            ...m,
            fixApproval: {
              ...m.fixApproval,
              skippedCount: m.fixApproval.skippedCount + 1,
              currentIndex: m.fixApproval.currentIndex + 1,
            },
          }
        : m
    ));
  }, []);

  /**
   * Approve all pending fixes at once.
   */
  const approveAllFixes = useCallback(async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.fixApproval) return;

    const pendingFixes = msg.fixApproval.fixes.filter((f) => f.status === 'pending');
    setPhase('executing');

    for (const fix of pendingFixes) {
      updateFix(messageId, fix.id, { status: 'executing' });
      try {
        const result = await executeTool(fix.toolCall);
        updateFix(messageId, fix.id, { status: result.success ? 'done' : 'failed', result });
        setMessages((prev) => prev.map((m) =>
          m.id === messageId && m.fixApproval
            ? { ...m, fixApproval: { ...m.fixApproval, completedCount: m.fixApproval.completedCount + (result.success ? 1 : 0) } }
            : m
        ));
        // Small delay between fixes so canvas updates are visible
        await new Promise((r) => setTimeout(r, 300));
      } catch {
        updateFix(messageId, fix.id, { status: 'failed' });
      }
    }

    setPhase('idle');
  }, [messages, executeTool]);

  /** Internal helper: update a single fix's fields */
  function updateFix(messageId: string, fixId: string, updates: Partial<PendingFix>) {
    setMessages((prev) => prev.map((m) =>
      m.id === messageId && m.fixApproval
        ? {
            ...m,
            fixApproval: {
              ...m.fixApproval,
              fixes: m.fixApproval.fixes.map((f) => f.id === fixId ? { ...f, ...updates } : f),
            },
          }
        : m
    ));
  }

  return {
    open, toggle, close,
    messages, phase, streamBuffer, executionLog,
    sendMessage, stopGeneration, clearMessages,
    analyzeAndProposeFixes, approveFix, skipFix, approveAllFixes,
  };
}

// ── Store query helpers ───────────────────────────────────────────────────
// These use `useBuilderStore.getState()` (the static accessor) so they can
// be called outside React render — no hook rules apply here.

/**
 * Resolve a page identifier (id, "current", name substring) to a page ID.
 */
function resolvePageId(id: string): string | null {
  const { project, selectedPageId } = useBuilderStore.getState();
  if (!project) return null;
  const pages = project.pages;
  // Exact ID match
  if (pages.find((p) => p.id === id)) return id;
  // Current-page keywords
  if (id === 'current' || id === 'active' || id === 'this') {
    return selectedPageId ?? pages[0]?.id ?? null;
  }
  // Case-insensitive name match
  const byName = pages.find((p) => p.name.toLowerCase().includes(id.toLowerCase()));
  return byName?.id ?? selectedPageId ?? pages[0]?.id ?? null;
}

/**
 * Resolve a section identifier (id, partial id, type) to a section ID.
 */
function resolveSectionId(id: string): string | null {
  const state = useBuilderStore.getState();
  const allSections = state.getSections();
  // Exact ID
  if (allSections.find((s) => s.id === id)) return id;
  // Partial ID
  const byPartial = allSections.find((s) => s.id.includes(id) || id.includes(s.id));
  if (byPartial) return byPartial.id;
  // By type
  const byType = allSections.find((s) => s.type === id || s.type.includes(id));
  return byType?.id ?? null;
}

/**
 * Find a section and its parent page ID.
 */
function findSection(sectionId: string): {
  pageId: string;
  section: ReturnType<ReturnType<typeof useBuilderStore.getState>['getSections']>[number];
} | null {
  const state = useBuilderStore.getState();
  if (!state.project) return null;
  for (const page of state.project.pages) {
    // page.sections is string[] — look up each in the sections dictionary
    for (const sid of page.sections) {
      if (sid === sectionId || sid.includes(sectionId)) {
        const section = state.project.sections?.[sid];
        if (section) return { pageId: page.id, section };
      }
    }
  }
  return null;
}

// Expose findSection for use in executeTool (currently unused directly but kept for future tool expansions)
export { findSection };

// ── Fix plan helpers ──────────────────────────────────────────────────────
// Deterministically map SAST findings and suggestions to builder tool calls.

interface SASTFindingLike {
  id?: string;
  severity: string;
  category: string;
  message: string;
  recommendation: string;
  sectionType?: string;
}

interface SuggestionLike {
  id?: string;
  type: string;
  title: string;
  description: string;
  priority: number;
}

function mapFindingToToolCall(finding: SASTFindingLike): ToolCall | null {
  const msg = finding.message.toLowerCase();
  const { project, selectedPageId } = useBuilderStore.getState();
  const pageId = selectedPageId ?? project?.pages[0]?.id ?? 'home';

  // SEO issues → set_seo
  if (finding.category === 'seo') {
    if (msg.includes('title') || msg.includes('description') || msg.includes('meta')) {
      return {
        tool: 'set_seo',
        params: {
          pageId,
          ...(msg.includes('title') ? { title: project?.name ?? 'My Website' } : {}),
          ...(msg.includes('description') ? { description: `${project?.name ?? 'My Website'} — professional website built with Forge Builder` } : {}),
        },
      };
    }
  }

  // Missing sections → add_section
  if (finding.category === 'conversion' || finding.category === 'ux') {
    if (msg.includes('newsletter') || msg.includes('email signup')) {
      return { tool: 'add_section', params: { pageId, sectionType: 'newsletter' } };
    }
    if (msg.includes('testimonial') || msg.includes('review')) {
      return { tool: 'add_section', params: { pageId, sectionType: 'testimonials' } };
    }
    if (msg.includes('trust') || msg.includes('badge')) {
      return { tool: 'add_section', params: { pageId, sectionType: 'trust-badges' } };
    }
    if (msg.includes('faq')) {
      return { tool: 'add_section', params: { pageId, sectionType: 'faq' } };
    }
  }

  // Section content fixes → update_section
  if (finding.sectionType) {
    const sections = useBuilderStore.getState().getSections();
    const section = sections.find((s) => s.type === finding.sectionType);
    if (section) {
      if (msg.includes('placeholder') || msg.includes('lorem ipsum') || msg.includes('sample text')) {
        return {
          tool: 'generate_content',
          params: { sectionType: finding.sectionType, brief: `Generate professional content for a ${finding.sectionType} section. ${finding.recommendation}` },
        };
      }
    }
  }

  return null;
}

function mapSuggestionToToolCall(suggestion: SuggestionLike): ToolCall | null {
  const { project, selectedPageId } = useBuilderStore.getState();
  const pageId = selectedPageId ?? project?.pages[0]?.id ?? 'home';
  const title = suggestion.title.toLowerCase();

  if (title.includes('newsletter') || title.includes('email')) {
    return { tool: 'add_section', params: { pageId, sectionType: 'newsletter' } };
  }
  if (title.includes('testimonial') || title.includes('review')) {
    return { tool: 'add_section', params: { pageId, sectionType: 'testimonials' } };
  }
  if (title.includes('trust') || title.includes('badge')) {
    return { tool: 'add_section', params: { pageId, sectionType: 'trust-badges' } };
  }
  if (title.includes('faq')) {
    return { tool: 'add_section', params: { pageId, sectionType: 'faq' } };
  }
  if (title.includes('seo') || title.includes('title') || title.includes('description')) {
    return { tool: 'set_seo', params: { pageId, title: project?.name ?? 'My Website' } };
  }
  if (title.includes('page') && title.includes('add')) {
    const pageName = title.match(/add\s+(\w+)\s+page/i)?.[1] ?? 'New Page';
    return { tool: 'add_page', params: { name: pageName } };
  }
  return null;
}
