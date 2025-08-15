import {create} from 'zustand';

interface CartState {
  cartCount: number;
  increment: () => void;
  decrement: () => void;
  setCount: (count: number) => void;
}

export const useCartStore = create<CartState>((set) => ({
  cartCount: 0,
  increment: () => set((state) => ({ cartCount: state.cartCount + 1 })),
  decrement: () => set((state) => ({ cartCount: state.cartCount - 1 })),
  setCount: (count) => set({ cartCount: count }),
}));
