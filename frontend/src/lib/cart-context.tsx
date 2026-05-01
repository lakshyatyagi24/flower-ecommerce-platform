"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  saleMode?: 'PURCHASE' | 'ENQUIRY';
  gstRate?: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  gstTotal: number;
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export class EnquiryOnlyProductError extends Error {
  constructor(productName: string) {
    super(`"${productName}" is enquiry-only — please send an enquiry instead of adding to cart.`);
    this.name = 'EnquiryOnlyProductError';
  }
}

const CartContext = createContext<CartState | undefined>(undefined);

const STORAGE_KEY = 'flower_cart_v1';

function loadInitial(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((it) => it && typeof it.productId === 'number');
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(loadInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1) => {
    if (item.saleMode === 'ENQUIRY') {
      throw new EnquiryOnlyProductError(item.name);
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    });
  }, []);

  const remove = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.price, 0), [items]);
  const gstTotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (i.gstRate ? (i.price * i.quantity * i.gstRate) / 100 : 0),
        0,
      ),
    [items],
  );

  const value = useMemo<CartState>(
    () => ({
      items,
      count,
      subtotal,
      gstTotal,
      add,
      setQuantity,
      remove,
      clear,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
    }),
    [items, count, subtotal, gstTotal, add, setQuantity, remove, clear, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function formatINR(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `₹${amount.toFixed(0)}`;
  }
}
