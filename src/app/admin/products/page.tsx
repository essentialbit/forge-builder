"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Package, Loader2, Eye, EyeOff, Archive, Upload, Download } from "lucide-react";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductDrawer } from "./ProductDrawer";

type Product = {
  id: string;
  sku: string;
  slug: string;
  title: string;
  description: string;
  productType: string;
  status: "draft" | "active" | "archived";
  price: number;
  compareAtPrice: number | null;
  totalInventory: number;
  inStock: boolean;
  featuredImage: string;
  createdAt: number;
  updatedAt: number;
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "draft" | "archived">("all");
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const limit = 50;

  const importRef = useRef<HTMLInputElement | null>(null);
  async function handleImport(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/catalog/products/import", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      alert(`Import failed: ${data.error || res.status}`);
      return;
    }
    alert(`Imported — created: ${data.created}, updated: ${data.updated}, skipped: ${data.skipped}, errors: ${data.errors?.length ?? 0}`);
    load();
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        search,
        status,
        limit: String(limit),
        offset: String(offset),
      });
      const res = await fetch(`/api/catalog/products?${qs}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, status, offset]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(id: string, next: Product["status"]) {
    await fetch(`/api/catalog/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-slate-400">{total} total · showing {items.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.open("/api/catalog/products/export", "_blank")} className="border-slate-700 text-slate-300">
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => importRef.current?.click()} className="border-slate-700 text-slate-300">
            <Upload className="w-4 h-4 mr-1.5" /> Import CSV
          </Button>
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = "";
          }} />
          <Button onClick={() => setEditing("new")} className="bg-amber-500 hover:bg-amber-600 text-black">
            <Plus className="w-4 h-4 mr-1.5" /> New product
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="Search by title or SKU..."
            className="pl-9 bg-slate-900 border-slate-700 text-white"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setOffset(0);
          }}
          className="h-9 px-3 rounded-md bg-slate-900 border border-slate-700 text-slate-200 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="mb-3">No products found.</p>
            <Button onClick={() => setEditing("new")} className="bg-amber-500 hover:bg-amber-600 text-black">
              Create your first product
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 w-12"></th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 cursor-pointer" onClick={() => setEditing(p.id)}>
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded bg-slate-800 overflow-hidden flex items-center justify-center">
                      {p.featuredImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.featuredImage} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{p.title}</div>
                    <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-400 capitalize">{p.productType}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">
                    ${p.price.toFixed(2)}
                    {p.compareAtPrice && p.compareAtPrice > p.price ? (
                      <span className="text-xs text-slate-500 line-through ml-2">${p.compareAtPrice.toFixed(2)}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      {p.status === "active" ? (
                        <button title="Set draft" onClick={() => toggleStatus(p.id, "draft")} className="p-1.5 rounded hover:bg-slate-700 text-slate-400">
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button title="Publish" onClick={() => toggleStatus(p.id, "active")} className="p-1.5 rounded hover:bg-slate-700 text-green-400">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button title="Archive" onClick={() => toggleStatus(p.id, "archived")} className="p-1.5 rounded hover:bg-slate-700 text-slate-400">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
          <Button variant="outline" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>
            Previous
          </Button>
          <span>
            {offset + 1}–{Math.min(offset + items.length, total)} of {total}
          </span>
          <Button variant="outline" onClick={() => setOffset(offset + limit)} disabled={offset + items.length >= total}>
            Next
          </Button>
        </div>
      )}

      {editing && (
        <ProductDrawer
          productId={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "draft" | "active" | "archived" }) {
  const map = {
    active: "bg-green-500/10 text-green-400 border-green-500/30",
    draft: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    archived: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${map[status]}`}>{status}</span>;
}
