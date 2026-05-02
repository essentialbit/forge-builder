"use client";

/**
 * Forge Builder — Home Landing Page
 *
 * Claude-inspired home experience:
 *   ✦ Personalised greeting "Hi [name]! What are we building today?"
 *   ✦ Large AI chat prompt — describe any website in plain English
 *   ✦ Industry quick-build cards (15 industries)
 *   ✦ Recent projects grid with open/continue/delete actions
 *   ✦ File import: drag-and-drop + File System Access API for local folders
 *   ✦ Single-prompt auto-build via /api/ai/build-from-prompt
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Plus, FolderOpen, Upload, Clock, Zap,
  Loader2, X, MoreVertical, Trash2, ExternalLink, Settings,
  Package, LogOut, FileText, Globe, Wand2, ArrowRight,
} from "lucide-react";
import { getCurrentUserFromCookie, signOut } from "@/lib/auth";
import { INDUSTRY_META, type IndustryKey } from "@/lib/ai/industry-templates";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published";
  updated: string;
  pages: Array<{ id: string; name: string; sections: string[] }>;
}

interface BuildResult {
  projectId: string;
  projectName: string;
  industryName: string;
  industryEmoji: string;
  sectionsCreated: number;
  pagesCreated: number;
  aiEnhanced: boolean;
  message: string;
}

// ── Greeting ──────────────────────────────────────────────────────────────

function getGreeting(name: string) {
  const hour = new Date().getHours();
  const first = name.split(" ")[0];
  if (hour < 12) return { line1: `Good morning, ${first}!`, emoji: "☀️" };
  if (hour < 17) return { line1: `Good afternoon, ${first}!`, emoji: "👋" };
  return { line1: `Good evening, ${first}!`, emoji: "🌙" };
}

// ── Animated placeholder ──────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  'Build a luxury jewellery store called "Aurora Gems" with hero, collections, and testimonials…',
  'Create a modern restaurant website for "La Bella Italia" with a menu and reservation section…',
  'Design a SaaS landing page for a project management tool with pricing and feature highlights…',
  'Build a fitness studio site with class schedules, trainer profiles, and membership plans…',
  'Create a portfolio for a UX designer with case studies, skills, and a contact form…',
  'Make a real estate site with property listings, agent profiles, and a property search tool…',
];

function useTypingPlaceholder() {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const target = EXAMPLE_PROMPTS[idx];
    const delay = deleting ? 16 : charIdx < target.length ? 36 : 2200;
    const t = setTimeout(() => {
      if (!deleting && charIdx < target.length) { setText(target.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }
      else if (!deleting) { setDeleting(true); }
      else if (deleting && charIdx > 0) { setText(target.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }
      else { setDeleting(false); setIdx(i => (i + 1) % EXAMPLE_PROMPTS.length); }
    }, delay);
    return () => clearTimeout(t);
  }, [text, idx, charIdx, deleting]);
  return text;
}

// ── Quick build industries ────────────────────────────────────────────────

const QUICK_INDUSTRIES: IndustryKey[] = [
  'restaurant','ecommerce','portfolio','saas',
  'healthcare','fitness','agency','blog',
  'realestate','education','event','legal',
  'hotel','nonprofit','jewellery',
];

const INDUSTRY_EXAMPLE_PROMPTS: Partial<Record<IndustryKey, string>> = {
  restaurant: 'Build a restaurant website called "The Gourmet Kitchen" with a hero, menu sections, about us, and contact form',
  ecommerce: 'Create an online store called "The Modern Shop" with featured products, categories, testimonials, and newsletter',
  portfolio: 'Build a creative portfolio for a UI/UX designer with project showcase, skills section, testimonials, and contact',
  saas: 'Build a SaaS landing page for a team productivity tool with features, pricing table, testimonials, and free trial CTA',
  healthcare: 'Create a medical practice website with services, doctor profiles, patient testimonials, and appointment booking',
  fitness: 'Build a fitness studio website with class schedule, trainer profiles, membership plans, and transformation stories',
  agency: 'Create a digital marketing agency website with services, case studies, team page, and project enquiry form',
  blog: 'Build a content blog with featured articles, topic categories, newsletter signup, and author profiles',
  realestate: 'Create a real estate agency website with featured listings, agent profiles, testimonials, and property search',
  education: 'Build an online academy with featured courses, instructor profiles, student reviews, and enrolment CTA',
  event: 'Create an event planning website with services gallery, client testimonials, and booking enquiry form',
  legal: 'Build a law firm website with practice areas, attorney profiles, client testimonials, and free consultation CTA',
  hotel: 'Create a luxury hotel website with rooms and suites, hotel amenities, guest reviews, and direct booking section',
  nonprofit: 'Build a charity website with our mission, programs, impact stats, inspiring stories, and donation CTA',
  jewellery: 'Create a fine jewellery store with collections, bestsellers, trust badges, customer reviews, and newsletter',
};

// ── Project Card ──────────────────────────────────────────────────────────

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const totalSections = project.pages?.reduce((acc, p) => acc + (p.sections?.length ?? 0), 0) ?? 0;
  const hue = (project.id.charCodeAt(0) * 17 + project.id.charCodeAt(1) * 7) % 360;

  return (
    <div className="group relative bg-white/[0.03] hover:bg-white/[0.055] border border-white/[0.08] hover:border-amber-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer">
      <Link href={`/builder/${project.id}`} className="block">
        <div className="h-36 relative overflow-hidden" style={{ background: `linear-gradient(135deg, hsl(${hue},28%,14%) 0%, hsl(${(hue+30)%360},22%,9%) 100%)` }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-15">
            <Globe className="w-16 h-16 text-white" />
          </div>
          <div className="absolute bottom-3 left-3 flex gap-1">
            {project.pages?.slice(0, 3).map(p => (
              <div key={p.id} className="text-[9px] font-medium bg-black/40 text-white/50 px-1.5 py-0.5 rounded-full backdrop-blur-sm">{p.name}</div>
            ))}
          </div>
          <div className={cn("absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
            project.status === "published"
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/20 text-amber-400 border-amber-500/30")}>
            {project.status === "published" ? "● Live" : "○ Draft"}
          </div>
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/builder/${project.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm group-hover:text-amber-400 transition-colors truncate">{project.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description || "No description"}</p>
          </Link>
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden text-xs">
                  <Link href={`/builder/${project.id}`} className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors" onClick={() => setMenuOpen(false)}>
                    <FileText className="w-3.5 h-3.5" /> Open in Builder
                  </Link>
                  <Link href={`/preview/${project.id}`} target="_blank" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors" onClick={() => setMenuOpen(false)}>
                    <ExternalLink className="w-3.5 h-3.5" /> Preview Site
                  </Link>
                  <div className="h-px bg-slate-700 mx-2 my-1" />
                  <button onClick={() => { setMenuOpen(false); onDelete(project.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Project
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-600">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(project.updated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{project.pages?.length ?? 0} pages</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{totalSections} sections</span>
        </div>
      </div>
    </div>
  );
}

// ── Build success toast ───────────────────────────────────────────────────

function BuildSuccessToast({ result, onDismiss }: { result: BuildResult; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-xl">{result.industryEmoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Built successfully!</p>
          <p className="text-xs text-slate-400 mt-0.5">{result.message}</p>
          {result.aiEnhanced && <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1"><Sparkles className="w-3 h-3" />AI-enhanced content</p>}
        </div>
        <button onClick={onDismiss} className="text-slate-600 hover:text-slate-300"><X className="w-4 h-4" /></button>
      </div>
      <Link href={`/builder/${result.projectId}`}
        className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors">
        Open in Builder <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ── Import zone ───────────────────────────────────────────────────────────

function ImportZone() {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const names = Array.from(files).map(f => f.name).join(", ");
    setStatus(`Selected: ${names} — file import coming soon!`);
    setTimeout(() => setStatus(null), 4000);
  };

  const handleFolder = async () => {
    if (!('showDirectoryPicker' in window)) {
      setStatus("Folder access requires Chrome or Edge. Use file upload instead.");
      setTimeout(() => setStatus(null), 4000);
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dh = await (window as any).showDirectoryPicker({ mode: 'read' });
      const files: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const [name] of dh as any) files.push(name as string);
      setStatus(`"${dh.name}" — ${files.length} files found. Import coming soon!`);
      setTimeout(() => setStatus(null), 5000);
    } catch (e: unknown) { if ((e as Error).name !== 'AbortError') { setStatus("Could not access folder."); setTimeout(() => setStatus(null), 3000); } }
  };

  return (
    <div className="mt-8">
      <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={cn("border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200",
          dragging ? "border-amber-500/60 bg-amber-500/5" : "border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.02]")}>
        <div className="flex items-center justify-center gap-8">
          <button onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center transition-colors"><Upload className="w-5 h-5" /></div>
            <span className="text-xs font-medium">Upload Files</span>
            <span className="text-[10px] text-slate-600">HTML, CSS, images, CSV</span>
          </button>
          <div className="h-14 w-px bg-white/[0.07]" />
          <button onClick={handleFolder}
            className="flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center transition-colors"><FolderOpen className="w-5 h-5" /></div>
            <span className="text-xs font-medium">Open Folder</span>
            <span className="text-[10px] text-slate-600">Access local project files</span>
          </button>
          <div className="h-14 w-px bg-white/[0.07]" />
          <div className="flex flex-col items-center gap-2 text-slate-600">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center opacity-50">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span className="text-xs font-medium">Figma Import</span>
            <span className="text-[10px]">Coming soon</span>
          </div>
        </div>
        {status && <p className="mt-4 text-xs text-amber-400">{status}</p>}
        <p className="mt-4 text-[10px] text-slate-700">Drop files anywhere · CSV for bulk products · HTML to import existing sites</p>
      </div>
      <input ref={fileRef} type="file" multiple accept=".html,.css,.js,.json,.csv,.png,.jpg,.webp,.svg" className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryKey | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const placeholder = useTypingPlaceholder();

  useEffect(() => {
    const u = getCurrentUserFromCookie();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
  }, [router]);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json()).then(setProjects).catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
    setBuildError(null);
  };

  const handleIndustryClick = (id: IndustryKey) => {
    setSelectedIndustry(id);
    setPrompt(INDUSTRY_EXAMPLE_PROMPTS[id] ?? `Build a ${INDUSTRY_META[id].name.toLowerCase()} website`);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleBuild = useCallback(async () => {
    if (!prompt.trim() || building) return;
    setBuilding(true);
    setBuildError(null);
    setBuildResult(null);
    try {
      const res = await fetch("/api/ai/build-from-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), industry: selectedIndustry ?? undefined }),
      });
      if (!res.ok) { const e = await res.json() as { error: string }; throw new Error(e.error); }
      const result = await res.json() as BuildResult;
      setBuildResult(result);
      setPrompt("");
      setSelectedIndustry(null);
      const updated = await fetch("/api/projects").then(r => r.json()) as Project[];
      setProjects(updated);
    } catch (e) {
      setBuildError((e as Error).message || "Build failed. Please try again.");
    } finally {
      setBuilding(false);
    }
  }, [prompt, building, selectedIndustry]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleBuild(); }
  };

  const handleDeleteProject = (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleSignOut = async () => { await signOut(); router.replace("/login"); };

  const greeting = user ? getGreeting(user.name) : null;
  const visibleIndustries = showAll ? QUICK_INDUSTRIES : QUICK_INDUSTRIES.slice(0, 8);

  if (!user) return null;

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg,#050810 0%,#0a0f1a 50%,#060a10 100%)' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[15%] w-[700px] h-[700px] rounded-full opacity-[0.035]" style={{ background: 'radial-gradient(circle,#f59e0b,transparent)' }} />
        <div className="absolute bottom-[-15%] right-[5%] w-[600px] h-[600px] rounded-full opacity-[0.025]" style={{ background: 'radial-gradient(circle,#6366f1,transparent)' }} />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold">Forge Builder</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products" className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            <Package className="w-4 h-4" />Catalog
          </Link>
          <Link href="/admin" className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            <Settings className="w-4 h-4" />Admin
          </Link>
          <div className="relative">
            <button onClick={() => setUserMenuOpen(v => !v)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] transition-all">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-xs font-bold text-black">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-slate-300 hidden sm:inline">{user.name.split(" ")[0]}</span>
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-11 w-52 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl z-20 overflow-hidden text-sm">
                  <div className="px-3 py-2.5 border-b border-slate-700/60">
                    <p className="font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                    <Settings className="w-3.5 h-3.5" />Settings
                  </Link>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-3.5 h-3.5" />Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-24">

        {/* Greeting */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Offline-capable · Local AI · 15+ Industries
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 leading-tight tracking-tight">
            {greeting?.emoji} {greeting?.line1}
          </h1>
          <p className="text-xl text-slate-400 font-light">What are we building today?</p>
        </div>

        {/* Prompt input */}
        <div className={cn("relative rounded-2xl border transition-all duration-300",
          prompt.trim()
            ? "border-amber-500/40 bg-white/[0.04] shadow-2xl shadow-amber-500/5"
            : "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14]")}>
          {selectedIndustry && (
            <div className="flex items-center gap-2 px-4 pt-3.5">
              <span className="text-lg">{INDUSTRY_META[selectedIndustry].emoji}</span>
              <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {INDUSTRY_META[selectedIndustry].name}
              </span>
              <button onClick={() => { setSelectedIndustry(null); }} className="text-slate-600 hover:text-slate-300 ml-auto transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder + "▎"}
            rows={3}
            className="w-full bg-transparent px-5 pt-4 pb-3 text-white placeholder-slate-600 resize-none focus:outline-none text-sm leading-relaxed"
            style={{ minHeight: "100px", maxHeight: "200px" }}
          />
          <div className="flex items-center justify-between px-4 pb-3.5 gap-3">
            <p className="text-[11px] text-slate-600 hidden sm:block">
              Describe any website · AI builds it in seconds · <span className="text-slate-700">⌘↵ to build</span>
            </p>
            <button
              onClick={handleBuild}
              disabled={!prompt.trim() || building}
              className={cn("flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ml-auto",
                prompt.trim() && !building
                  ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/25"
                  : "bg-white/[0.05] text-slate-600 cursor-not-allowed")}>
              {building
                ? <><Loader2 className="w-4 h-4 animate-spin" />Building…</>
                : <><Wand2 className="w-4 h-4" />Build Site</>}
            </button>
          </div>
        </div>

        {buildError && (
          <div className="mt-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0" />{buildError}
          </div>
        )}

        {/* Industry quick-build */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Quick Build — Choose an industry</p>
            <button onClick={() => setShowAll(v => !v)} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors">
              {showAll ? "Show less" : `Show all ${QUICK_INDUSTRIES.length}`}
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {visibleIndustries.map(id => {
              const meta = INDUSTRY_META[id];
              const sel = selectedIndustry === id;
              return (
                <button key={id} onClick={() => handleIndustryClick(id)} title={meta.description}
                  className={cn("flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-xl border transition-all",
                    sel
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-sm shadow-amber-500/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.14] text-slate-400 hover:text-slate-200")}>
                  <span className="text-xl leading-none">{meta.emoji}</span>
                  <span className="text-[10px] font-medium leading-tight text-center">{meta.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.05]" /></div>
          <div className="relative flex justify-center">
            <span className="px-4 text-[11px] text-slate-600 uppercase tracking-widest" style={{ background: 'linear-gradient(135deg,#050810,#0a0f1a)' }}>or continue working</span>
          </div>
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Your Projects</h2>
            <Link href="/builder/new"
              onClick={async e => {
                e.preventDefault();
                const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "New Project", description: "" }) });
                const p = await res.json() as Project;
                router.push(`/builder/${p.id}`);
              }}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/[0.06] hover:border-white/[0.14]">
              <Plus className="w-3.5 h-3.5" />New blank project
            </Link>
          </div>

          {loadingProjects ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-56 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/[0.07] rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-300 mb-2">No projects yet</h3>
              <p className="text-sm text-slate-600 mb-6 max-w-xs mx-auto">Describe your website above and Forge AI will build it in seconds.</p>
              <button onClick={() => textareaRef.current?.focus()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-xl transition-colors">
                <Wand2 className="w-4 h-4" />Build My First Site
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(p => <ProjectCard key={p.id} project={p} onDelete={handleDeleteProject} />)}
              <button onClick={() => textareaRef.current?.focus()}
                className="min-h-[200px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/[0.06] hover:border-amber-500/30 rounded-2xl text-slate-600 hover:text-slate-400 transition-all hover:bg-amber-500/[0.02] group">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] group-hover:bg-amber-500/10 flex items-center justify-center transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">New Project</span>
              </button>
            </div>
          )}
        </div>

        {/* Import zone */}
        <ImportZone />

        {/* Footer */}
        <p className="mt-12 text-center text-[11px] text-slate-700">
          Forge Builder · Offline AI · idea → website in seconds
        </p>
      </main>

      {buildResult && <BuildSuccessToast result={buildResult} onDismiss={() => setBuildResult(null)} />}
    </div>
  );
}
