"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Layers, ImageIcon, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, collections: 0, media: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/catalog/products?limit=1").then((r) => r.json()),
      fetch("/api/catalog/collections").then((r) => r.json()),
      fetch("/api/catalog/media").then((r) => r.json()),
    ])
      .then(([p, c, m]) => {
        setStats({
          products: p.total ?? 0,
          collections: Array.isArray(c) ? c.length : 0,
          media: Array.isArray(m) ? m.length : 0,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-slate-400 mb-8">Professional catalog management for your Forge Builder site.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Package className="w-5 h-5" />} label="Products" value={stats.products} href="/admin/products" />
        <StatCard icon={<Layers className="w-5 h-5" />} label="Collections" value={stats.collections} href="/admin/collections" />
        <StatCard icon={<ImageIcon className="w-5 h-5" />} label="Media" value={stats.media} href="/admin/media" />
      </div>

      <div className="mt-10 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Getting started</h2>
        <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
          <li>Products were auto-imported from Forge Jewellery on first boot.</li>
          <li>Edit a product → click Products in the sidebar, then a row.</li>
          <li>Sections that reference product slugs / SKUs will resolve against this catalog.</li>
          <li>Publish writes the updated catalog into the static export.</li>
        </ol>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500 transition-colors"
    >
      <div className="flex items-center justify-between text-slate-400 mb-2">
        {icon}
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
    </Link>
  );
}
