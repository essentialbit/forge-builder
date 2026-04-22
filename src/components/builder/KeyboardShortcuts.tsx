"use client";

import { useEffect, useRef } from "react";
import { useBuilderStore } from "@/lib/builder-store";

/**
 * Global keyboard handlers + idle autosave.
 *
 * Shortcuts:
 *   ⌘/Ctrl+S          save
 *   ⌘/Ctrl+Z          undo
 *   ⌘/Ctrl+Shift+Z    redo  (also ⌘/Ctrl+Y)
 *   ⌘/Ctrl+D          duplicate selected section
 *   Delete/Backspace  delete selected section (when nothing focused)
 *   Esc               deselect section
 */
export function KeyboardShortcuts() {
  const {
    hasUnsavedChanges,
    autosaveEnabled,
    saveProject,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedSectionId,
    selectSection,
    removeSection,
    duplicateSection,
  } = useBuilderStore();

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const editable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (meta && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        saveProject();
        return;
      }
      if (meta && (e.key === "z" || e.key === "Z") && !e.shiftKey) {
        if (editable) return; // let input field undo work
        e.preventDefault();
        if (canUndo()) undo();
        return;
      }
      if (meta && ((e.key === "z" || e.key === "Z") && e.shiftKey || e.key === "y" || e.key === "Y")) {
        if (editable) return;
        e.preventDefault();
        if (canRedo()) redo();
        return;
      }
      if (meta && (e.key === "d" || e.key === "D")) {
        if (editable) return;
        if (selectedSectionId) {
          e.preventDefault();
          duplicateSection(selectedSectionId);
        }
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !editable && selectedSectionId) {
        e.preventDefault();
        removeSection(selectedSectionId);
        return;
      }
      if (e.key === "Escape" && !editable && selectedSectionId) {
        e.preventDefault();
        selectSection(null);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveProject, undo, redo, canUndo, canRedo, selectedSectionId, removeSection, selectSection, duplicateSection]);

  // Autosave — debounced
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!autosaveEnabled || !hasUnsavedChanges) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveProject();
    }, 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasUnsavedChanges, autosaveEnabled, saveProject]);

  // Warn on unload if unsaved
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (useBuilderStore.getState().hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  return null;
}
