"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useCart } from "@/lib/cart-context";

const loadDrawer = () => import("./CartDrawer");
// The drawer (line items, images, focus handling) is only needed once the cart is opened, so it is not part of
// every page's first-load JS. It is fetched when the browser is idle so the first open is instant.
const CartDrawer = dynamic(loadDrawer, { ssr: false });

export default function CartDrawerLazy() {
  const { isOpen } = useCart();
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => void loadDrawer());
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => void loadDrawer(), 2000);
    return () => clearTimeout(t);
  }, []);
  return isOpen ? <CartDrawer /> : null;
}
