"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";

// The drawer (line items, images, focus handling) is only needed once the cart is opened, so it is not part of
// every page's first-load JS. It stays mounted after the first open so closing/reopening keeps working.
const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });

export default function CartDrawerLazy() {
  const { isOpen } = useCart();
  const [everOpened, setEverOpened] = useState(false);
  useEffect(() => {
    if (isOpen) setEverOpened(true);
  }, [isOpen]);
  return isOpen || everOpened ? <CartDrawer /> : null;
}
