import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // product id (e.g. D-001)
  variantId?: number;
  name: string;
  sku: string;
  price: number;
  compareAt?: number | null;
  image: string;
  category: string;
  size: string;
  qty: number;
}

interface CartStore {
  cart: CartItem[];
  wishlist: string[];
  cartOpen: boolean;
  authOpen: boolean;
  selectedProductId: string | null;
  setCartOpen: (open: boolean) => void;
  setAuthOpen: (open: boolean) => void;
  setSelectedProductId: (id: string | null) => void;
  addToCart: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  updateQty: (id: string, size: string, qty: number) => void;
  removeFromCart: (id: string, size: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: ['D-001', 'SS-001'],
      cartOpen: false,
      authOpen: false,
      selectedProductId: null,
      setCartOpen: (open) => set({ cartOpen: open }),
      setAuthOpen: (open) => set({ authOpen: open }),
      setSelectedProductId: (id) => set({ selectedProductId: id }),
      addToCart: (item, qty = 1) =>
        set((state) => {
          const existingIndex = state.cart.findIndex(
            (c) => c.id === item.id && c.size === item.size
          );
          if (existingIndex > -1) {
            const updated = [...state.cart];
            updated[existingIndex]!.qty += qty;
            return { cart: updated, cartOpen: true };
          }
          return { cart: [...state.cart, { ...item, qty }], cartOpen: true };
        }),
      updateQty: (id, size, qty) =>
        set((state) => {
          if (qty <= 0) {
            return {
              cart: state.cart.filter((c) => !(c.id === id && c.size === size)),
            };
          }
          return {
            cart: state.cart.map((c) =>
              c.id === id && c.size === size ? { ...c, qty } : c
            ),
          };
        }),
      removeFromCart: (id, size) =>
        set((state) => ({
          cart: state.cart.filter((c) => !(c.id === id && c.size === size)),
        })),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (id) =>
        set((state) => {
          const exists = state.wishlist.includes(id);
          return {
            wishlist: exists
              ? state.wishlist.filter((w) => w !== id)
              : [...state.wishlist, id],
          };
        }),
    }),
    {
      name: 'norasol-store-cart',
      partialize: (state) => ({ cart: state.cart, wishlist: state.wishlist }),
    }
  )
);
