"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";

const PROTECTED = ["/builder", "/admin"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
    if (!isProtected) return;

    const user = getCurrentUserFromCookie();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router]);

  return <>{children}</>;
}
