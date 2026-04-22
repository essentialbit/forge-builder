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
      className={`group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg p-2.5 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50 ring-2 ring-amber-500" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">{section.name}</div>
          <div className="text-xs text-slate-400 line-clamp-2">{section.description}</div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white hover:bg-slate-700"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
