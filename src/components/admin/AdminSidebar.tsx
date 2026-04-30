"use client";

import Link from "next/link";
import { LayoutDashboard, Package, Layers, ImageIcon, ArrowLeft, Mail, History, LogOut } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

export function AdminSidebar() {
  return (
    <aside className="w-60 border-r border-slate-800 flex flex-col bg-slate-900/50">
      <div className="h-16 border-b border-slate-800 flex items-center px-4 gap-2">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold">
          🔨
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Forge Builder</div>
          <div className="text-xs text-slate-400">Admin</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        <NavItem href="/admin" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
        <NavItem href="/admin/products" icon={<Package className="w-4 h-4" />} label="Products" />
        <NavItem href="/admin/collections" icon={<Layers className="w-4 h-4" />} label="Collections" />
        <NavItem href="/admin/media" icon={<ImageIcon className="w-4 h-4" />} label="Media" />
        <NavItem href="/admin/submissions" icon={<Mail className="w-4 h-4" />} label="Submissions" />
        <NavItem href="/admin/revisions" icon={<History className="w-4 h-4" />} label="Revisions" />
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-1">
        <SignOutButton />
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Projects
        </Link>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
