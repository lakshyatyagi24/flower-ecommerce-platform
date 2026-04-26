"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const menuItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Sliders", href: "/sliders", icon: Image },
  { name: "Products", href: "/products", icon: Package },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
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
