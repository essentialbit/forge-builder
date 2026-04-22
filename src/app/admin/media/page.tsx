"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Media = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: number;
};

export default function MediaPage() {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/catalog/media");
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function fmtSize(b: number) {
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
    return (b / 1024 / 1024).toFixed(1) + " MB";
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Media library</h1>

      <div className="mb-6 max-w-md">
        <ImageUploader
          value=""
          onChange={() => load()}
          label="Upload new image"
        />
      </div>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No media uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((m) => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden group">
              <div className="aspect-square bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/catalog/media/${m.id}`} alt={m.originalName} className="w-full h-full object-cover" />
              </div>
              <div className="p-2 text-xs">
                <div className="truncate text-slate-300">{m.originalName}</div>
                <div className="text-[10px] text-slate-500 flex justify-between mt-0.5">
                  <span>{m.width && m.height ? `${m.width}×${m.height}` : m.mimeType.split("/")[1]}</span>
                  <span>{fmtSize(m.size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
