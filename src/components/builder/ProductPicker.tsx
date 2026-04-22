"use client";

import { useEffect, useState } from "react";
import { Search, Check, X, Package, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Product = {
  id: string;
  sku: string;
  slug: string;
  title: string;
  price: number;
  productType: string;
  featuredImage: string;
};

interface Props {
  value: string[]; // array of slugs (what sections store)
  onChange: (slugs: string[]) => void;
}

export function ProductPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [all, setAll] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Load selected product details once
  const [selected, setSelected] = useState<Map<string, Product>>(new Map());
  useEffect(() => {
    if (value.length === 0) {
      setSelected(new Map());
      return;
    }
    fetch(`/api/catalog/products?limit=500&status=all`)
      .then((r) => r.json())
      .then((data) => {
        const bySlug = new Map<string, Product>();
        for (const p of data.items as Product[]) bySlug.set(p.slug, p);
        setSelected(new Map(value.map((s) => [s, bySlug.get(s)]).filter(([, p]) => p) as [string, Product][]));
      });
  }, [value]);

  async function loadAll() {
    setLoading(true);
    const qs = new URLSearchParams({ limit: "200", status: "active", search });
    const res = await fetch(`/api/catalog/products?${qs}`);
    const data = await res.json();
    setAll(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(loadAll, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, open]);

  function toggle(slug: string) {
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug));
    } else {
      onChange([...value, slug]);
    }
  }

  function remove(slug: string) {
    onChange(value.filter((s) => s !== slug));
  }

  function move(idx: number, delta: -1 | 1) {
    const next = [...value];
    const t = idx + delta;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {/* Selected products */}
      {value.length > 0 && (
        <div className="space-y-1.5">
          {value.map((slug, i) => {
            const p = selected.get(slug);
            return (
              <div key={slug} className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-md p-1.5">
                <div className="w-8 h-8 rounded bg-slate-900 overflow-hidden flex-shrink-0">
                  {p?.featuredImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.featuredImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-4 h-4 m-auto mt-2 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{p?.title ?? slug}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {p ? `${p.sku} · $${p.price}` : "unresolved slug"}
                  </div>
                </div>
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-slate-500 hover:text-white disabled:opacity-30 text-xs px-1"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="text-slate-500 hover:text-white disabled:opacity-30 text-xs px-1"
                >
                  ↓
                </button>
                <button onClick={() => remove(slug)} className="p-1 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        {value.length > 0 ? "Add more products" : "Pick products from catalog"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">Pick products</DialogTitle>
            <DialogDescription className="text-slate-400">
              Selected: {value.length} · Click a product to toggle
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 bg-slate-950 border-slate-700 text-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {loading ? (
              <p className="text-slate-400 py-4 text-center">Loading…</p>
            ) : all.length === 0 ? (
              <p className="text-slate-400 py-8 text-center">No products match.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {all.map((p) => {
                  const checked = value.includes(p.slug);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggle(p.slug)}
                      className={`flex items-center gap-2 p-2 rounded-md border text-left transition-colors ${
                        checked
                          ? "bg-amber-500/10 border-amber-500"
                          : "bg-slate-800/30 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className="w-10 h-10 rounded bg-slate-900 overflow-hidden flex-shrink-0">
                        {p.featuredImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.featuredImage} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 m-auto mt-3 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{p.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">${p.price}</div>
                      </div>
                      {checked && <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="w-3.5 h-3.5 mr-1" />
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
