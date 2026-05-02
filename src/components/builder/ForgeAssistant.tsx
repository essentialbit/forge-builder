"use client";

/**
 * Forge Builder — AI Assistant Panel
 *
 * Full-featured AI panel with:
 *   • Live streaming chat (Ollama / WebLLM / rules-based fallback)
 *   • SAST analysis: issues, accessibility, security, SEO
 *   • Configuration drift detection
 *   • Auto-suggestions with one-click actions
 *   • Self-learning status + manual trigger
 *   • Builder context-aware: knows your current page and sections
 *
 * Replaces the old static tips/shortcuts popup.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Send, StopCircle, Bot, ShieldAlert, Lightbulb,
  RotateCcw, Trash2, BookOpen, Wifi, WifiOff, ChevronDown,
  Keyboard, HelpCircle, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAI } from "@/hooks/useAI";
import { ModelStatusBadge } from "@/components/ai/ModelStatusBadge";
import { SASTReport } from "@/components/ai/SASTReport";
import { SuggestionCards } from "@/components/ai/SuggestionCards";
import { useBuilderStore } from "@/lib/builder-store";
import type { AutoSuggestion } from "@/lib/ai/types";

// ── Tab definitions ─────────────────────────────────────────────────────────

type Tab = "chat" | "analysis" | "suggestions" | "learn" | "shortcuts";

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: "chat", label: "Chat", icon: Bot },
  { id: "analysis", label: "Analysis", icon: ShieldAlert },
  { id: "suggestions", label: "Tips", icon: Lightbulb },
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "shortcuts", label: "Keys", icon: Keyboard },
];

// ── Keyboard shortcuts reference ────────────────────────────────────────────

const SHORTCUTS = [
  { keys: "Cmd+Z", action: "Undo" },
  { keys: "Cmd+Shift+Z", action: "Redo" },
  { keys: "Cmd+S", action: "Save" },
  { keys: "Cmd+K", action: "Command Palette" },
  { keys: "Cmd+P", action: "Preview" },
  { keys: "Delete", action: "Remove selected section" },
  { keys: "Cmd+D", action: "Duplicate section" },
  { keys: "Cmd+/", action: "Toggle inspector" },
  { keys: "Esc", action: "Deselect section" },
  { keys: "↑ / ↓", action: "Select prev / next section" },
];

// ── Chat message bubble ─────────────────────────────────────────────────────

function MessageBubble({
  role,
  content,
  provider,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  provider?: string;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-amber-600 text-white rounded-br-sm"
            : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50"
        )}
      >
        {/* Render markdown-ish content */}
        {content.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/).map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          if (part.startsWith("`") && part.endsWith("`"))
            return (
              <code key={i} className="bg-slate-700 px-1 rounded font-mono text-[10px]">
                {part.slice(1, -1)}
              </code>
            );
          if (part === "\n") return <br key={i} />;
          return part;
        })}
        {!isUser && provider && provider !== "rules-based" && (
          <span className="block text-[9px] text-slate-600 mt-1">{provider}</span>
        )}
      </div>
    </div>
  );
}

// ── Quick prompt chips ─────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "What sections should my homepage have?",
  "Generate a hero section for diamond rings",
  "How do I improve my SEO?",
  "Add a countdown timer for a flash sale",
  "What trust signals should I add?",
];

// ── Main component ─────────────────────────────────────────────────────────

export function ForgeAssistant() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get builder state for context
  const { project, selectedPageId } = useBuilderStore((s) => ({
    project: s.project,
    selectedPageId: s.selectedPageId,
  }));

  const currentPage = project?.pages?.find((p: { id: string }) => p.id === selectedPageId);
  const rawSections = (currentPage?.sections ?? []) as unknown[];
  const sections: Array<{ type: string; id: string }> = rawSections
    .filter((s): s is { type: string; id: string } => typeof s === 'object' && s !== null)
    .map((s) => ({ type: String((s as Record<string, unknown>).type ?? ''), id: String((s as Record<string, unknown>).id ?? '') }));

  const builderContext = {
    projectName: project?.name ?? "Untitled",
    currentPage: currentPage?.name ?? "Unknown",
    pageCount: project?.pages?.length ?? 0,
    sectionCount: sections.length,
    sections,
    theme: project?.theme as Record<string, unknown> | undefined,
  };

  const {
    status, statusLoading,
    messages, isGenerating, streamingContent,
    sendMessage, stopGeneration, clearChat,
    analysis, runAnalysis,
    isLearning, lastLearnResult, triggerLearning,
  } = useAI(builderContext);

  // Auto-scroll chat
  useEffect(() => {
    if (tab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent, tab]);

  // Auto-run analysis when tab opens
  useEffect(() => {
    if (tab === "analysis" && analysis.analyzedAt === null && !analysis.isAnalyzing && project) {
      runAnalysis(project);
    }
  }, [tab, analysis.analyzedAt, analysis.isAnalyzing, project, runAnalysis]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isGenerating) return;
    sendMessage(input.trim());
    setInput("");
  }, [input, isGenerating, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionAction = (suggestion: AutoSuggestion) => {
    if (!suggestion.action) return;
    if (suggestion.action.type === "add-section") {
      setTab("chat");
      sendMessage(`Add a "${(suggestion.action.payload as { type: string })?.type}" section to my current page`);
    } else if (suggestion.action.type === "navigate") {
      setTab("chat");
      sendMessage(suggestion.title);
    }
  };

  const isOnline = status?.features?.selfLearn !== false;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-all duration-200",
          open
            ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
            : "bg-gradient-to-br from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500"
        )}
        title="Forge AI Assistant"
        aria-label={open ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {open ? <X className="w-4 h-4" /> : <Sparkles className="w-5 h-5" />}

        {/* Unread badge */}
        {!open && analysis.sast.filter((f) => f.severity === "critical" || f.severity === "high").length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
            {analysis.sast.filter((f) => f.severity === "critical" || f.severity === "high").length}
          </span>
        )}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-20 right-6 z-50 w-[360px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Forge AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span title={isOnline ? "Online — self-learning active" : "Offline"}>
              {isOnline
                ? <Wifi className="w-3.5 h-3.5 text-emerald-500" aria-hidden />
                : <WifiOff className="w-3.5 h-3.5 text-slate-600" aria-hidden />
              }
            </span>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Model status bar */}
        <div className="px-4 py-1.5 border-b border-slate-800/60 bg-slate-950/60">
          <ModelStatusBadge
            status={status}
            loading={statusLoading}
            isLearning={isLearning}
          />
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/80">
          {TABS.map((t) => {
            const Icon = t.icon;
            const badge =
              t.id === "analysis"
                ? analysis.sast.filter((f) => f.severity === "critical" || f.severity === "high").length
                : t.id === "suggestions"
                ? analysis.suggestions.length
                : 0;

            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  tab === t.id
                    ? "text-amber-400 border-b-2 border-amber-500"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {badge > 0 && (
                  <span className="absolute top-1.5 right-2 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ── CHAT TAB ── */}
          {tab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Welcome message */}
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        👋 Hi! I&apos;m your <span className="text-amber-400 font-semibold">Forge AI assistant</span>, running locally on your machine.
                      </p>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        I know your builder inside out — ask me to generate content, explain features, improve conversions, or analyse your site.
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-600 px-1">Quick prompts:</p>
                    <div className="flex flex-col gap-1.5">
                      {QUICK_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => sendMessage(p)}
                          className="text-left text-xs px-3 py-2 bg-slate-800/40 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 border border-slate-700/30 hover:border-slate-600 transition-all"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((m) => (
                  <MessageBubble key={m.id} role={m.role} content={m.content} provider={m.provider} />
                ))}

                {/* Streaming */}
                {isGenerating && streamingContent && (
                  <MessageBubble role="assistant" content={streamingContent + "▌"} />
                )}
                {isGenerating && !streamingContent && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-bl-sm px-3 py-2">
                      <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/80">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your builder…"
                    rows={1}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-amber-600 transition-colors"
                    style={{ minHeight: "36px", maxHeight: "100px" }}
                    disabled={isGenerating}
                  />
                  <div className="flex gap-1.5">
                    {messages.length > 0 && (
                      <button
                        onClick={clearChat}
                        className="p-2 text-slate-600 hover:text-slate-400 transition-colors"
                        title="Clear chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isGenerating ? (
                      <button
                        onClick={stopGeneration}
                        className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                        title="Stop generation"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="p-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white rounded-lg transition-colors"
                        title="Send (Enter)"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[9px] text-slate-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}

          {/* ── ANALYSIS TAB ── */}
          {tab === "analysis" && (
            <div className="flex-1 overflow-y-auto p-3">
              <SASTReport
                score={analysis.score}
                summary={analysis.summary}
                sast={analysis.sast}
                drift={analysis.drift}
                analyzedAt={analysis.analyzedAt}
                isAnalyzing={analysis.isAnalyzing}
                onReanalyze={() => project && runAnalysis(project)}
              />
            </div>
          )}

          {/* ── SUGGESTIONS TAB ── */}
          {tab === "suggestions" && (
            <div className="flex-1 overflow-y-auto p-3">
              <SuggestionCards
                suggestions={analysis.suggestions}
                onAction={handleSuggestionAction}
              />
              {analysis.analyzedAt === null && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => { setTab("analysis"); project && runAnalysis(project); }}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Run analysis to generate suggestions →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── LEARN TAB ── */}
          {tab === "learn" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-white">Self-Learning</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When online, Forge AI researches e-commerce best practices, SEO strategies, accessibility standards, and jewellery domain knowledge — automatically injecting what it learns into every response.
                </p>
              </div>

              {/* Knowledge stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
                  <p className="text-2xl font-bold text-amber-400">{status?.knowledgeCount ?? 0}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Facts learned</p>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
                  <p className="text-2xl font-bold text-emerald-400">10</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Web sources</p>
                </div>
              </div>

              {/* Last learn result */}
              {lastLearnResult && (
                <div className={cn(
                  "rounded-lg p-2.5 border text-xs",
                  lastLearnResult.online
                    ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
                    : "bg-slate-800/40 border-slate-700/30 text-slate-400"
                )}>
                  {lastLearnResult.online
                    ? `✓ Learned ${lastLearnResult.totalItemsLearned} new facts this session`
                    : "⚡ Running offline — using cached knowledge"}
                </div>
              )}

              {/* Sources list */}
              <div>
                <p className="text-[10px] text-slate-600 mb-2 uppercase tracking-wide">Learning Sources</p>
                <div className="space-y-1.5">
                  {[
                    { label: "web.dev Core Web Vitals", cat: "Performance" },
                    { label: "Google SEO Starter Guide", cat: "SEO" },
                    { label: "WCAG 2.1 AA Quick Reference", cat: "Accessibility" },
                    { label: "OWASP Top 10 Security Risks", cat: "Security" },
                    { label: "Nielsen Norman E-commerce UX", cat: "UX" },
                    { label: "Baymard Cart Abandonment Research", cat: "Conversion" },
                    { label: "GIA Gemstone Education", cat: "Jewellery" },
                    { label: "Schema.org Product Types", cat: "SEO" },
                    { label: "MDN Critical Rendering Path", cat: "Performance" },
                    { label: "Mozilla Developer Network", cat: "Web Dev" },
                  ].map(({ label, cat }) => (
                    <div key={label} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-[10px] text-slate-600">{cat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual trigger */}
              <button
                onClick={() => triggerLearning(true)}
                disabled={isLearning}
                className="w-full py-2 bg-amber-700/40 hover:bg-amber-700/60 disabled:opacity-50 text-amber-300 text-xs rounded-lg border border-amber-700/30 transition-colors flex items-center justify-center gap-2"
              >
                {isLearning ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    Learning in progress…
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Refresh all knowledge now
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── SHORTCUTS TAB ── */}
          {tab === "shortcuts" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-2">Keyboard Shortcuts</p>
                {SHORTCUTS.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <kbd className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-amber-300 font-mono text-xs">
                      {s.keys}
                    </kbd>
                    <span className="text-xs text-slate-400">{s.action}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-[10px] text-slate-600 uppercase tracking-wide">Resources</p>
                {[
                  { label: "View on GitHub", url: "https://github.com/essentialbit/forge-builder" },
                  { label: "Report an issue", url: "https://github.com/essentialbit/forge-builder/issues" },
                ].map(({ label, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
