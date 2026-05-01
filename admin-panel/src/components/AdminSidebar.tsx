"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  FolderTree,
  Image,
  LogOut,
  Star,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminApi } from "@/lib/api";

const menuItems = [
  { name: "Dashboard", href: "/", icon: Home, badgeKey: null as string | null },
  { name: "Categories", href: "/categories", icon: FolderTree, badgeKey: null },
  { name: "Sliders", href: "/sliders", icon: Image, badgeKey: null },
  { name: "Products", href: "/products", icon: Package, badgeKey: null },
  { name: "Orders", href: "/orders", icon: ShoppingCart, badgeKey: null },
  { name: "Enquiries", href: "/enquiries", icon: MessageSquare, badgeKey: "openEnquiries" },
  { name: "Reviews", href: "/reviews", icon: Star, badgeKey: null },
  { name: "Customers", href: "/customers", icon: Users, badgeKey: null },
  { name: "Analytics", href: "/analytics", icon: BarChart3, badgeKey: null },
  { name: "Settings", href: "/settings", icon: Settings, badgeKey: null },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const refresh = () =>
      adminApi
        .enquiryStats()
        .then((res) => {
          if (!cancelled) setBadges((b) => ({ ...b, openEnquiries: res.open }));
        })
        .catch(() => {});
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [user]);

  return (
    <Card className="w-64 h-full p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        {user && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
        )}
      </div>
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">{item.name}</span>
                {badgeCount && badgeCount > 0 ? (
                  <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-rose-500 text-white text-xs font-semibold">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                ) : null}
              </Button>
            </Link>
          );
        })}
      </nav>
      <Button variant="ghost" className="w-full justify-start mt-2" onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </Card>
  );
}
