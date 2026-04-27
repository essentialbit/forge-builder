"use client";

import { useState } from "react";
import { useBuilderStore } from "@/lib/builder-store";
import { getBlockDefinition } from "@/lib/block-registry";
import type { Block, Section } from "@/types/builder";
import { FieldRenderer } from "@/components/builder/Inspector";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateClientId } from "@/lib/utils";

interface BlocksEditorProps {
  section: Section;
  sectionDef: { blocks?: Array<{ type: string; name: string; icon: string; schema: Record<string, unknown>; defaultSettings: Record<string, unknown> }> };
  onChange: (blocks: Block[]) => void;
}

export function BlocksEditor({ section, sectionDef, onChange }: BlocksEditorProps) {
  const blocks = section.blocks ?? [];
  const blockDefs = sectionDef.blocks ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(blocks, oldIndex, newIndex));
  }

  function addBlock(blockType: string) {
    const def = getBlockDefinition(blockType);
    if (!def) return;
    const newBlock: Block = {
      id: generateClientId("blk"),
      type: blockType as Block["type"],
      settings: { ...def.defaultSettings },
    };
    onChange([...blocks, newBlock]);
  }

  function updateBlock(id: string, key: string, value: unknown) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, settings: { ...b.settings, [key]: value } } : b)));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }

  if (blockDefs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {section.name} Items
        </label>
        <AddBlockMenu blockDefs={blockDefs} onAdd={addBlock} />
      </div>

      {blocks.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4 border border-dashed border-slate-700 rounded-md">
          No items yet — click "Add" to add one.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {blocks.map((block) => (
                <SortableBlockItem
                  key={block.id}
                  block={block}
                  onUpdate={(key, value) => updateBlock(block.id, key, value)}
                  onRemove={() => removeBlock(block.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

/* ── Add block dropdown menu ── */
function AddBlockMenu({
  blockDefs,
  onAdd,
}: {
  blockDefs: BlocksEditorProps["sectionDef"]["blocks"];
  onAdd: (type: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-slate-700 text-slate-300 hover:text-white"
        onClick={() => setOpen((v) => !v)}
      >
        <Plus className="w-3 h-3 mr-1" />
        Add
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-44 overflow-hidden">
            {(blockDefs ?? []).map((bd) => (
              <button
                key={bd.type}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                onClick={() => { onAdd(bd.type); setOpen(false); }}
              >
                {/* icon placeholder */}
                <span className="w-4 text-slate-400">{bd.icon[0]}</span>
                {bd.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sortable block row ── */
function SortableBlockItem({
  block,
  onUpdate,
  onRemove,
}: {
  block: Block;
  onUpdate: (key: string, value: unknown) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const def = getBlockDefinition(block.type);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-slate-800/70 border border-slate-700 rounded-lg overflow-hidden ${isDragging ? "opacity-50 ring-1 ring-amber-500" : ""}`}
    >
      {/* Block header row */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-800">
        <button
          {...attributes}
          {...listeners}
          className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing p-0.5"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left text-xs font-medium text-slate-200 flex items-center gap-1 hover:text-white"
        >
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="text-slate-400 text-[10px] uppercase tracking-wider mr-1">
            {def?.name ?? block.type}:
          </span>
          {block.settings.quote
            ? String(block.settings.quote).slice(0, 30) + (String(block.settings.quote).length > 30 ? "…" : "")
            : block.settings.label
            ? String(block.settings.label)
            : block.settings.question
            ? String(block.settings.question).slice(0, 30)
            : block.settings.heading
            ? String(block.settings.heading)
            : block.type}
        </button>
        <button
          onClick={onRemove}
          className="text-slate-500 hover:text-red-400 p-1"
          title="Remove"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Expanded fields */}
      {open && def && (
        <div className="px-3 py-2 space-y-3 border-t border-slate-700/50">
          {Object.entries(def.schema).map(([key, field]) => (
            <FieldRenderer
              key={key}
              fieldKey={key}
              field={field as import("@/types/builder").FieldSchema}
              value={block.settings[key]}
              onChange={(value) => onUpdate(key, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}