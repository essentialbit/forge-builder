"use client";

import { sectionRegistry, sectionCategories } from "@/lib/section-registry";
import { useBuilderStore } from "@/lib/builder-store";
import { Button } from "@/components/ui/button";
import { useDraggable } from "@dnd-kit/core";
import {
  Sparkles,
  Megaphone,
  Grid3x3,
  LayoutGrid,
  FileText,
  Image,
  Shield,
  Mail,
  PanelBottom,
  ShoppingCart,
  Users,
  Menu,
  Plus,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Megaphone,
  Grid3x3,
  LayoutGrid,
  FileText,
  Image,
  Shield,
  Mail,
  // registry uses 'AlignBottom' for the footer section; map it to PanelBottom (lucide has this one)
  AlignBottom: PanelBottom,
  PanelBottom,
  ShoppingCart,
  Users,
  Menu,
};

export function SectionLibrary() {
  const { selectedPageId, addSection } = useBuilderStore();

  function handleAddSection(type: string) {
    if (selectedPageId) {
      addSection(selectedPageId, type);
    }
  }

  return (
    <div className="p-3">
      {sectionCategories.map((category) => {
        const sections = Object.values(sectionRegistry).filter(
          (s) => s.category === category.id
        );

        if (sections.length === 0) return null;

        const Icon = iconMap[category.icon] || FileText;

        return (
          <div key={category.id} className="mb-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              <Icon className="w-3.5 h-3.5" />
              {category.name}
            </div>

            <div className="space-y-1.5">
              {sections.map((section) => (
                <DraggableSection
                  key={section.type}
                  section={section}
                  onAdd={() => handleAddSection(section.type)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DraggableSectionProps {
  section: (typeof sectionRegistry)[string];
  onAdd: () => void;
}

function DraggableSection({ section, onAdd }: DraggableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${section.type}`,
    data: { type: "library-section", sectionType: section.type },
  });

  const Icon = iconMap[section.icon] || FileText;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg p-2 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50 ring-2 ring-amber-500" : ""
      }`}
    >
      <div className="h-14 rounded bg-slate-900 mb-2 overflow-hidden relative">
        <SectionThumb type={section.type as string} />
      </div>
      <div className="flex items-start gap-2">
        <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white leading-tight">{section.name}</div>
          <div className="text-[10px] text-slate-500 line-clamp-1">{section.description}</div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white hover:bg-slate-700"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

/** SVG thumbnail sketches per section type. Lightweight, stylised. */
function SectionThumb({ type }: { type: string }) {
  switch (type) {
    case "hero":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
          <rect x="60" y="18" width="80" height="6" rx="2" fill="#D4AF37" />
          <rect x="70" y="28" width="60" height="3" rx="1" fill="#64748b" />
          <rect x="85" y="38" width="30" height="8" rx="4" fill="#D4AF37" />
        </svg>
      );
    case "product-grid":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${30 + i * 38}, 14)`}>
              <rect width="28" height="20" rx="2" fill="#334155" />
              <rect y="23" width="20" height="3" rx="1" fill="#64748b" />
              <rect y="28" width="12" height="3" rx="1" fill="#D4AF37" />
            </g>
          ))}
        </svg>
      );
    case "category-showcase":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={25 + i * 40} y="12" width="34" height="34" rx="4" fill={`hsl(${i * 45}, 40%, 50%)`} />
          ))}
        </svg>
      );
    case "featured_product":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
          <rect x="20" y="10" width="60" height="40" rx="4" fill="#334155" />
          <rect x="90" y="18" width="80" height="5" rx="2" fill="#fff" />
          <rect x="90" y="28" width="40" height="4" rx="2" fill="#D4AF37" />
          <rect x="90" y="38" width="50" height="8" rx="4" fill="#D4AF37" />
        </svg>
      );
    case "announcement":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#0f172a" />
          <rect x="0" y="24" width="200" height="12" fill="#D4AF37" />
          <rect x="70" y="27" width="60" height="6" rx="2" fill="#000" />
        </svg>
      );
    case "rich-text":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
          <rect x="50" y="16" width="100" height="4" rx="1" fill="#94a3b8" />
          <rect x="40" y="26" width="120" height="3" rx="1" fill="#64748b" />
          <rect x="45" y="33" width="110" height="3" rx="1" fill="#64748b" />
          <rect x="50" y="40" width="100" height="3" rx="1" fill="#64748b" />
        </svg>
      );
    case "image-block":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
          <rect x="40" y="10" width="120" height="40" rx="4" fill="#334155" />
          <circle cx="75" cy="25" r="5" fill="#fbbf24" />
          <path d="M55 40 L90 25 L120 35 L150 15 L165 40 Z" fill="#475569" />
        </svg>
      );
    case "trust-badges":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${20 + i * 45}, 24)`}>
              <circle cx="6" cy="6" r="5" fill="#D4AF37" />
              <rect x="15" y="3" width="28" height="3" rx="1" fill="#94a3b8" />
              <rect x="15" y="8" width="20" height="3" rx="1" fill="#64748b" />
            </g>
          ))}
        </svg>
      );
    case "newsletter":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#D4AF37" />
          <rect x="70" y="14" width="60" height="5" rx="2" fill="#000" />
          <rect x="40" y="30" width="90" height="14" rx="7" fill="#fff" />
          <rect x="135" y="30" width="30" height="14" rx="7" fill="#000" />
        </svg>
      );
    case "footer":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#0f172a" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${25 + i * 55}, 10)`}>
              <rect width="30" height="4" rx="1" fill="#D4AF37" />
              <rect y="9" width="40" height="2" rx="1" fill="#475569" />
              <rect y="14" width="35" height="2" rx="1" fill="#475569" />
              <rect y="19" width="38" height="2" rx="1" fill="#475569" />
            </g>
          ))}
          <rect x="60" y="48" width="80" height="2" rx="1" fill="#334155" />
        </svg>
      );
    case "faq":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(40, ${8 + i * 17})`}>
              <rect width="110" height="3" rx="1" fill="#94a3b8" />
              <rect y="6" width="80" height="2" rx="1" fill="#64748b" />
              <text x="118" y="6" fontSize="8" fill="#D4AF37">+</text>
            </g>
          ))}
        </svg>
      );
    case "testimonials":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${15 + i * 60}, 10)`}>
              <rect width="50" height="40" rx="4" fill="#fff" />
              <text x="4" y="10" fontSize="7" fill="#f59e0b">★★★★★</text>
              <rect x="4" y="14" width="40" height="2" rx="1" fill="#94a3b8" />
              <rect x="4" y="19" width="35" height="2" rx="1" fill="#94a3b8" />
              <rect x="4" y="24" width="30" height="2" rx="1" fill="#94a3b8" />
              <rect x="4" y="32" width="20" height="2" rx="1" fill="#64748b" />
            </g>
          ))}
        </svg>
      );
    case "spacer":
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
          <rect x="30" y="28" width="140" height="4" rx="1" strokeDasharray="4 3" stroke="#64748b" fill="none" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 60" className="w-full h-full">
          <rect width="200" height="60" fill="#1e293b" />
        </svg>
      );
  }
}
