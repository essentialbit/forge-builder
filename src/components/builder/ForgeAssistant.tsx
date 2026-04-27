"use client";

import { useState } from "react";
import { X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TIPS = [
  { icon: "🖱️", title: "Drag to reorder", tip: "Drag the ⠿ handle on any section to reorder it on your page." },
  { icon: "📱", title: "Preview on mobile", tip: "Use the device icons in the toolbar to preview your site on tablet and mobile." },
  { icon: "🎨", title: "Brand Kit", tip: "Open Brand Kit from the toolbar to set your colors, fonts, and logo globally." },
  { icon: "↩️", title: "Undo anything", tip: "Press Cmd+Z to undo. You have 50 levels of history." },
  { icon: "⚡", title: "Quick add sections", tip: "Press Cmd+K to open the command palette and quickly add any section type." },
  { icon: "🔍", title: "SEO settings", tip: "Click the 🔍 SEO tab in the left panel to set page titles and meta descriptions." },
  { icon: "💾", title: "Autosave is on", tip: "Your work saves automatically 3 seconds after you stop editing." },
  { icon: "🚀", title: "Publish to live", tip: "Click Publish in the toolbar to push your site to GitHub and Netlify instantly." },
  { icon: "🏷️", title: "Section names", tip: "Click any section name in the left panel to rename it." },
  { icon: "📋", title: "Duplicate sections", tip: "Right-click a section or use the ⋮ menu in the inspector to duplicate it." },
];

const SHORTCUTS = [
  { keys: "Cmd+S", action: "Save" },
  { keys: "Cmd+Z", action: "Undo" },
  { keys: "Cmd+Shift+Z", action: "Redo" },
  { keys: "Cmd+K", action: "Command Palette" },
  { keys: "Cmd+P", action: "Preview" },
  { keys: "Delete", action: "Remove selected section" },
];

type Tab = "tips" | "shortcuts" | "help";

export function ForgeAssistant() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("tips");

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 flex items-center justify-center shadow-lg transition-colors"
        title="Forge Assistant"
        aria-label="Open Forge Assistant"
      >
        {open ? <X className="w-4 h-4" /> : <HelpCircle className="w-5 h-5" />}
      </button>

      {/* Sliding panel */}
      <div
        className={cn(
          "fixed bottom-20 right-6 z-50 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{ maxHeight: "70vh" }}
      >
        {/* Panel header */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-2">
          <span className="text-amber-400 font-bold text-sm">Forge Assistant</span>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-800">
          {(["tips", "shortcuts", "help"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2 text-xs font-medium capitalize transition-colors",
                tab === t
                  ? "text-amber-400 border-b-2 border-amber-500"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "tips" && (
            <div className="p-3 space-y-2">
              {TIPS.map((tip) => (
                <div key={tip.title} className="bg-slate-800 rounded-lg p-3 flex gap-3">
                  <span className="text-lg leading-none mt-0.5">{tip.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{tip.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{tip.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "shortcuts" && (
            <div className="p-3">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-800">
                  {SHORTCUTS.map((s) => (
                    <tr key={s.keys} className="py-2">
                      <td className="py-2 pr-3">
                        <kbd className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-amber-300 font-mono text-xs">
                          {s.keys}
                        </kbd>
                      </td>
                      <td className="py-2 text-slate-300">{s.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "help" && (
            <div className="p-3 space-y-3">
              <div className="space-y-2">
                <a
                  href="https://github.com/essentialbit/forge-builder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 underline"
                >
                  View on GitHub
                </a>
                <a
                  href="https://github.com/essentialbit/forge-builder/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 underline"
                >
                  Report an issue
                </a>
              </div>
              <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-400">
                <p><span className="text-slate-300 font-medium">Publishing:</span> Click the Publish button in the toolbar to trigger a build and deploy.</p>
                <p><span className="text-slate-300 font-medium">GitHub:</span> Connect your repo in Publish settings to push your site&apos;s source code automatically.</p>
                <p><span className="text-slate-300 font-medium">Netlify:</span> Provide your Netlify Site ID to trigger continuous deploys from your GitHub repo.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
