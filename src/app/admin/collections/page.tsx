"use client";

import { useEffect, useState } from "react";
import { Layers, Plus, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  type: "manual" | "smart";
  rules: string;
};

export default function CollectionsPage() {
  const [items, setItems] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Array<{ id: string; title: string; sku: string; featuredImage: string }>>([]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/catalog/collections");
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleExpand(id: string) {
    if (expanded === id) {
      setExpanded(null);
      setExpandedItems([]);
      return;
    }
    const res = await fetch(`/api/catalog/collections?id=${id}`);
    const data = await res.json();
    setExpanded(id);
    setExpandedItems(data.items ?? []);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Collections</h1>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No collections yet. They will be auto-created when you seed products.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleExpand(c.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800/40"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{c.title}</div>
                  <div className="text-xs text-slate-500 font-mono">/{c.handle} · {c.type}</div>
                </div>
              </button>
              {expanded === c.id && (
                <div className="border-t border-slate-800 p-4">
                  <p className="text-xs text-slate-500 mb-3">{expandedItems.length} products in this collection</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {expandedItems.map((it) => (
                      <div key={it.id} className="bg-slate-800 rounded-md overflow-hidden">
                        <div className="aspect-square bg-slate-900">
                          {it.featuredImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.featuredImage} alt={it.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-slate-700 m-auto mt-8" />
                          )}
                        </div>
                        <div className="p-2">
                          <div className="text-xs font-medium text-white truncate">{it.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{it.sku}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
