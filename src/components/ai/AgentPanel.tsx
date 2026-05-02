"use client";

/**
 * Forge Builder — AI Agent Panel
 *
 * A Claude-style right-side sliding panel that:
 *   • Streams natural language responses
 *   • Executes builder actions live (add sections, update settings, etc.)
 *   • Shows real-time "thinking" + "executing" states
 *   • Supports web search when needed
 *   • Fully keyboard accessible
 *   • Drag-to-resize width
 *   • Undo-aware (all actions go through the builder store's history)
 *
 * Design: mimics Claude's browser extension side panel.
 * Toggle: Cmd+I keyboard shortcut or toolbar button.
 */

import {
  useRef, useEffect, useState, useCallback, useLayoutEffect,
} from "react";
import {
  Sparkles, X, Send, StopCircle, RotateCcw, ChevronDown,
  ChevronRight, Zap, Search, CheckCircle2, XCircle, Globe,
  Loader2, Copy, ThumbsUp, ThumbsDown, Maximize2, Minimize2,
  PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentPanel } from "@/hooks/useAgentPanel";
import type { AgentMessage, AgentPhase } from "@/hooks/useAgentPanel";
import type { ToolCall } from "@/lib/ai/builder-tools";

// ── Constants ─────────────────────────────────────────────────────────────

const MIN_WIDTH = 320;
const MAX_WIDTH = 680;
const DEFAULT_WIDTH = 400;

const STARTER_PROMPTS = [
  { icon: "🏗️", label: "Build a homepage", prompt: "Build a complete homepage for a luxury jewellery store with a hero, product grid, testimonials, and newsletter signup" },
  { icon: "✨", label: "Add a hero section", prompt: "Add a stunning hero section with an elegant headline for a moissanite ring collection" },
  { icon: "🎨", label: "Update brand colours", prompt: "Update my brand colours to a luxury jewellery palette — deep navy, gold accent, and cream background" },
  { icon: "📈", label: "Improve conversions", prompt: "Analyse my current page and add the missing elements that would improve conversions the most" },
  { icon: "🔍", label: "SEO audit & fix", prompt: "Check my SEO and fix any missing titles, descriptions, and structured data issues" },
  { icon: "🌐", label: "Research best practices", prompt: "Search the web for the latest jewellery e-commerce conversion optimisation strategies and apply the top 3" },
];

const PHASE_LABELS: Record<AgentPhase, string> = {
  idle: "",
  thinking: "Thinking…",
  executing: "Applying changes…",
  searching: "Searching the web…",
  done: "Done",
};

const TOOL_ICONS: Record<string, React.ElementType> = {
  add_section: Zap,
  update_section: Zap,
  remove_section: XCircle,
  duplicate_section: Copy,
  reorder_section: ChevronDown,
  update_brand_kit: Sparkles,
  add_page: Zap,
  select_section: ChevronRight,
  set_seo: Search,
  generate_content: Sparkles,
  search_web: Globe,
};

// ── Typing cursor ─────────────────────────────────────────────────────────

function TypingCursor() {
  return <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 animate-pulse align-middle" />;
}

// ── Inline markdown renderer ──────────────────────────────────────────────

function MdText({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        // Render inline bold/code
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        const rendered = parts.map((p, j) => {
          if (p.startsWith('**') && p.endsWith('**'))
            return <strong key={j} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
          if (p.startsWith('`') && p.endsWith('`'))
            return <code key={j} className="bg-slate-700/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-amber-300">{p.slice(1, -1)}</code>;
          return p;
        });
        if (line.startsWith('• ') || line.startsWith('- '))
          return <p key={i} className="flex gap-2"><span className="text-amber-500 mt-0.5">•</span><span>{rendered.slice(1)}</span></p>;
        if (/^\d+\./.test(line))
          return <p key={i} className="flex gap-2"><span className="text-amber-500 font-mono text-[11px] mt-0.5 min-w-[1rem]">{line.match(/^\d+/)?.[0]}.</span><span>{rendered.slice(1)}</span></p>;
        if (line.startsWith('# '))
          return <p key={i} className="font-bold text-white text-sm mt-2">{rendered.slice(1)}</p>;
        if (line.startsWith('## '))
          return <p key={i} className="font-semibold text-slate-200 mt-1.5">{rendered.slice(1)}</p>;
        return <p key={i}>{rendered}</p>;
      })}
    </div>
  );
}

// ── Tool action row ───────────────────────────────────────────────────────

function ActionRow({ action, index }: { action: ToolCall; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = TOOL_ICONS[action.tool] ?? Zap;
  const success = action.result?.success !== false;

  const toolLabel = action.tool.replace(/_/g, ' ');

  return (
    <div className="group">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
      >
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
          success ? "bg-emerald-900/60" : "bg-red-900/60"
        )}>
          {success
            ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            : <XCircle className="w-3 h-3 text-red-400" />
          }
        </div>
        <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <span className="text-xs text-slate-400 flex-1 capitalize">{toolLabel}</span>
        <span className="text-[10px] text-slate-600">#{index + 1}</span>
        {open ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
      </button>
      {open && (
        <div className="mx-2 mb-1 px-2 py-1.5 bg-slate-800/60 rounded-lg border border-slate-700/30 text-[10px] font-mono text-slate-400 overflow-x-auto">
          <p className="text-slate-500 mb-1">params:</p>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(action.params, null, 2)}</pre>
          {action.result && (
            <>
              <p className="text-slate-500 mt-1 mb-0.5">result:</p>
              <p className={cn(action.result.success ? "text-emerald-400" : "text-red-400")}>
                {action.result.message}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';
  const [actionsOpen, setActionsOpen] = useState(true);
  const [liked, setLiked] = useState<boolean | null>(null);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-amber-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* AI avatar + message */}
      <div className="flex items-start gap-3">
        {/* Forge AI avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Thoughts (collapsible, subtle) */}
          {message.thoughts && (
            <details className="mb-2">
              <summary className="text-[10px] text-slate-600 cursor-pointer hover:text-slate-400 transition-colors select-none">
                Reasoning
              </summary>
              <p className="text-[10px] text-slate-600 mt-1 italic leading-relaxed pl-2 border-l border-slate-700">
                {message.thoughts}
              </p>
            </details>
          )}

          {/* Main content */}
          <div className={cn(
            "text-sm text-slate-200 leading-relaxed",
            message.error && "text-red-400"
          )}>
            {message.content ? (
              <>
                <MdText content={message.content} />
                {message.isStreaming && <TypingCursor />}
              </>
            ) : message.isStreaming ? (
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            ) : null}
          </div>

          {/* Actions taken */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setActionsOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors mb-1"
              >
                {actionsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {message.actions.length} action{message.actions.length !== 1 ? 's' : ''} taken
                {message.actions.every((a) => a.result?.success) && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-1" />
                )}
              </button>
              {actionsOpen && (
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
                  {message.actions.map((action, i) => (
                    <ActionRow key={i} action={action} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback row */}
          {!message.isStreaming && message.content && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setLiked(true)}
                className={cn("p-1 rounded text-slate-600 hover:text-slate-300 transition-colors",
                  liked === true && "text-emerald-400")}
                title="Helpful"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => setLiked(false)}
                className={cn("p-1 rounded text-slate-600 hover:text-slate-300 transition-colors",
                  liked === false && "text-red-400")}
                title="Not helpful"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Phase indicator ───────────────────────────────────────────────────────

function PhaseIndicator({ phase }: { phase: AgentPhase }) {
  if (phase === 'idle' || phase === 'done') return null;

  const icons: Record<AgentPhase, React.ElementType> = {
    idle: Sparkles, done: CheckCircle2,
    thinking: Loader2, executing: Zap, searching: Globe,
  };
  const Icon = icons[phase];
  const colors: Record<AgentPhase, string> = {
    idle: '', done: '',
    thinking: 'text-amber-400',
    executing: 'text-blue-400',
    searching: 'text-emerald-400',
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border-t border-slate-800">
      <Icon className={cn("w-3.5 h-3.5 animate-pulse", colors[phase], phase === 'thinking' && 'animate-spin')} />
      <span className="text-xs text-slate-400">{PHASE_LABELS[phase]}</span>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────

interface AgentPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AgentPanel({ open, onClose }: AgentPanelProps) {
  const { messages, phase, sendMessage, stopGeneration, clearMessages } = useAgentPanel();
  const [input, setInput] = useState("");
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // ── Drag-to-resize ─────────────────────────────────────────────────

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startWidth: width };

    const handleMouseMove = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = resizeRef.current.startX - me.clientX;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeRef.current.startWidth + delta));
      setWidth(newWidth);
    };
    const handleMouseUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width]);

  // ── Send ──────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if (!input.trim() || phase !== 'idle') return;
    sendMessage(input.trim());
    setInput("");
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';
  }, [input, phase, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const panelWidth = isMaximized ? '100%' : `${width}px`;

  return (
    <div
      ref={panelRef}
      className={cn(
        "relative flex flex-col bg-slate-950 border-l border-slate-800 transition-all duration-300 overflow-hidden",
        open ? "opacity-100" : "opacity-0 w-0 pointer-events-none"
      )}
      style={{ width: open ? panelWidth : 0, minWidth: open ? MIN_WIDTH : 0, maxWidth: open ? MAX_WIDTH : 0 }}
      aria-label="AI Agent Panel"
      role="complementary"
    >
      {/* Resize handle */}
      {open && !isMaximized && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-amber-600/50 transition-colors z-10 group"
          title="Drag to resize"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-slate-700 group-hover:bg-amber-500 rounded-full transition-colors" />
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">Forge AI</p>
            <p className="text-[10px] text-slate-500 leading-tight">
              {phase !== 'idle' ? (
                <span className="text-amber-400 animate-pulse">{PHASE_LABELS[phase]}</span>
              ) : (
                'Ready'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsMaximized((v) => !v)}
            className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800"
            title={isMaximized ? "Restore size" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800"
            title="Close panel (Esc)"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="space-y-5">
            {/* Welcome card */}
            <div className="text-center pt-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-600/20 flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Forge AI</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[260px] mx-auto">
                I can build pages, add sections, write content, fix issues, and search the web — all directly in your builder.
              </p>
            </div>

            {/* Starter prompts */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Try asking:</p>
              {STARTER_PROMPTS.map(({ icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all group"
                >
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{label}</p>
                    <p className="text-[10px] text-slate-600 truncate">{prompt.slice(0, 55)}…</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-700 text-center pb-2">
              All actions are undoable with ⌘Z
            </p>
          </div>
        )}

        {/* Message list */}
        {messages.map((message) => (
          <div key={message.id} className="group">
            <MessageBubble message={message} />
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Phase indicator ──────────────────────────────────────────── */}
      <PhaseIndicator phase={phase} />

      {/* ── Input ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-slate-800 bg-slate-950">
        <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2.5 focus-within:border-amber-600 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={phase !== 'idle' ? "AI is working…" : "Ask anything or describe a task…"}
            rows={1}
            disabled={phase !== 'idle'}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
            style={{ minHeight: '24px', maxHeight: '140px' }}
          />
          <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
            {phase !== 'idle' ? (
              <button
                onClick={stopGeneration}
                className="w-8 h-8 bg-red-600 hover:bg-red-500 rounded-xl flex items-center justify-center transition-colors"
                title="Stop"
              >
                <StopCircle className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-8 h-8 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 rounded-xl flex items-center justify-center transition-colors"
                title="Send (Enter)"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        </div>
        <p className="text-[9px] text-slate-700 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line · All changes are undoable with ⌘Z
        </p>
      </div>
    </div>
  );
}

// ── Toolbar Toggle Button ─────────────────────────────────────────────────

interface AgentToggleButtonProps {
  open: boolean;
  onClick: () => void;
}

export function AgentToggleButton({ open, onClick }: AgentToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Forge AI Agent (⌘I)"
      className={cn(
        "relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
        open
          ? "bg-amber-600/20 text-amber-400 border border-amber-600/40"
          : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-transparent"
      )}
    >
      <Sparkles className={cn("w-4 h-4", open && "animate-pulse")} />
      <span className="hidden sm:inline">AI</span>
      {open && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
