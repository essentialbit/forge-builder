"use client";

import { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBuilderStore } from "@/lib/builder-store";
import { useState } from "react";

interface DnDProviderProps {
  children: ReactNode;
}

export function DnDProvider({ children }: DnDProviderProps) {
  const { setDragging, reorderSections, addSection, selectedPageId } = useBuilderStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    setDragging(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveId(null);
    setDragging(false);

    if (!over) return;

    const activeData = active.data.current;

    // Handle adding section from library
    if (activeData?.type === "library-section" && selectedPageId) {
      const sectionType = activeData.sectionType;
      addSection(selectedPageId, sectionType);
      return;
    }

    // Handle reordering within a page
    if (activeData?.type === "canvas-section" && over.data.current?.type === "canvas-section") {
      const fromIndex = activeData.index;
      const toIndex = over.data.current.index;

      if (fromIndex !== toIndex && selectedPageId) {
        reorderSections(selectedPageId, fromIndex, toIndex);
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    // Handle hover over for drop indicators
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      {children}
      <DragOverlay>
        {activeId ? <div className="w-64 h-16 bg-slate-700 rounded-lg opacity-50" /> : null}
      </DragOverlay>
    </DndContext>
  );
}

export function SortableProvider({ children }: { children: ReactNode }) {
  return (
    <SortableContext items={[]} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  );
}
