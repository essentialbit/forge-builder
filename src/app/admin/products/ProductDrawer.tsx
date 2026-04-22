"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, X, Save, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Product = {
  id: string;
  sku: string;
  slug: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string;
  status: "draft" | "active" | "archived";
  price: number;
  compareAtPrice: number | null;
  totalInventory: number;
  inStock: boolean;
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
};

interface Props {
  productId: string | null; // null = creating new
  onClose: () => void;
  onSaved: () => void;
}

const blank: Product = {
  id: "",
  sku: "",
  slug: "",
  title: "",
  description: "",
  vendor: "",
  productType: "",
  tags: "",
  status: "draft",
  price: 0,
  compareAtPrice: null,
  totalInventory: 0,
  inStock: true,
  featuredImage: "",
  seoTitle: "",
  seoDescription: "",
};

export function ProductDrawer({ productId, onClose, onSaved }: Props) {
  const [product, setProduct] = useState<Product>(blank);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(blank);
      return;
    }
    setLoading(true);
    fetch(`/api/catalog/products/${productId}`)
      .then((r) => r.json())
      .then((p) => setProduct({ ...blank, ...p }))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [productId]);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setProduct((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        productId ? `/api/catalog/products/${productId}` : "/api/catalog/products",
        {
          method: productId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Save failed (${res.status})`);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!productId) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/catalog/products/${productId}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-white">{productId ? "Edit product" : "New product"}</h2>
            <p className="text-xs text-slate-500 font-mono">{product.sku || "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            {productId && (
              <Button variant="outline" onClick={del} className="text-red-400 border-red-900 hover:bg-red-950">
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            )}
            <Button onClick={save} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-black">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-950/50 border border-red-900 text-red-300 text-sm rounded-md p-3">{error}</div>
            )}

            <Section title="Basics">
              <Field label="Title">
                <Input
                  value={product.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Gold Cuban Chain"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="SKU">
                  <Input value={product.sku} onChange={(e) => set("sku", e.target.value)} className="bg-slate-900 border-slate-700 text-white font-mono text-sm" />
                </Field>
                <Field label="Slug">
                  <Input value={product.slug} onChange={(e) => set("slug", e.target.value)} className="bg-slate-900 border-slate-700 text-white font-mono text-sm" />
                </Field>
              </div>
              <Field label="Description">
                <RichTextEditor value={product.description} onChange={(v) => set("description", v)} placeholder="Rich product description…" />
              </Field>
            </Section>

            <Section title="Media">
              <ImageUploader value={product.featuredImage} onChange={(url) => set("featuredImage", url)} label="Featured image" />
            </Section>

            <Section title="Pricing">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (AUD)">
                  <Input
                    type="number"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => set("price", Number(e.target.value))}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </Field>
                <Field label="Compare at (optional)">
                  <Input
                    type="number"
                    step="0.01"
                    value={product.compareAtPrice ?? ""}
                    onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)}
                    placeholder="—"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Inventory">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity">
                  <Input
                    type="number"
                    value={product.totalInventory}
                    onChange={(e) => set("totalInventory", Number(e.target.value))}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={product.status}
                    onChange={(e) => set("status", e.target.value as Product["status"])}
                    className="w-full h-9 px-3 rounded-md bg-slate-900 border border-slate-700 text-slate-200 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Organization">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Product type">
                  <Input
                    value={product.productType}
                    onChange={(e) => set("productType", e.target.value)}
                    placeholder="necklaces, rings…"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </Field>
                <Field label="Vendor">
                  <Input value={product.vendor} onChange={(e) => set("vendor", e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
                </Field>
              </div>
              <Field label="Tags (comma-separated)">
                <Input value={product.tags} onChange={(e) => set("tags", e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
              </Field>
            </Section>

            <Section title="SEO">
              <Field label="SEO title">
                <Input value={product.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
              </Field>
              <Field label="SEO description">
                <Textarea
                  value={product.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  rows={3}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </Field>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-300 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
