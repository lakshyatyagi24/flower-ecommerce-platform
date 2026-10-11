"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { isPublicAdminRoute } from "@/lib/public-routes";
import { Loader2 } from "lucide-react";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Login / password-reset pages get a clean layout with no sidebar
  if (isPublicAdminRoute(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // While the auth context redirects, render nothing to avoid flash
  if (!user) return null;

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
