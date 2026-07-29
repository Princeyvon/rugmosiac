import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  key: string; // productId + sizeId + color
  productId: string;
  slug: string;
  name: string;
  image?: string;
  sizeId?: string;
  sizeLabel?: string;
  color?: string;
  qty: number;
  unitPriceUsd?: number | null;
  unitPriceRwf?: number | null;
};

export type WishItem = {
  productId: string;
  slug: string;
  name: string;
  image?: string;
};

const CART_KEY = "mosiac.cart.v1";
const WISH_KEY = "mosiac.wishlist.v1";

type CartCtx = {
  items: CartItem[];
  count: number;
  add: (i: Omit<CartItem, "key" | "qty"> & { qty?: number }) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};
type WishCtx = {
  items: WishItem[];
  count: number;
  has: (productId: string) => boolean;
  toggle: (i: WishItem) => void;
  remove: (productId: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartCtx | null>(null);
const WishContext = createContext<WishCtx | null>(null);

function loadJSON<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wish, setWish] = useState<WishItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);

  useEffect(() => {
    setCart(loadJSON<CartItem[]>(CART_KEY, []));
    setWish(loadJSON<WishItem[]>(WISH_KEY, []));
  }, []);
  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);
  useEffect(() => {
    try { localStorage.setItem(WISH_KEY, JSON.stringify(wish)); } catch {}
  }, [wish]);

  const cartValue = useMemo<CartCtx>(() => ({
    items: cart,
    count: cart.reduce((s, i) => s + i.qty, 0),
    add: (i) => {
      const qty = i.qty ?? 1;
      const key = `${i.productId}::${i.sizeId ?? ""}::${i.color ?? ""}`;
      setCart((prev) => {
        const existing = prev.find((x) => x.key === key);
        if (existing) return prev.map((x) => x.key === key ? { ...x, qty: x.qty + qty } : x);
        return [...prev, { ...i, qty, key }];
      });
      setCartOpen(true);
    },
    remove: (k) => setCart((prev) => prev.filter((x) => x.key !== k)),
    setQty: (k, q) => setCart((prev) => prev.map((x) => x.key === k ? { ...x, qty: Math.max(1, q) } : x)),
    clear: () => setCart([]),
    open: cartOpen,
    setOpen: setCartOpen,
  }), [cart, cartOpen]);

  const wishValue = useMemo<WishCtx>(() => ({
    items: wish,
    count: wish.length,
    has: (id) => wish.some((w) => w.productId === id),
    toggle: (i) => setWish((prev) => prev.some((w) => w.productId === i.productId)
      ? prev.filter((w) => w.productId !== i.productId)
      : [...prev, i]),
    remove: (id) => setWish((prev) => prev.filter((w) => w.productId !== id)),
    open: wishOpen,
    setOpen: setWishOpen,
  }), [wish, wishOpen]);

  return (
    <CartContext.Provider value={cartValue}>
      <WishContext.Provider value={wishValue}>{children}</WishContext.Provider>
    </CartContext.Provider>
  );
}

const emptyCart: CartCtx = {
  items: [], count: 0, add: () => {}, remove: () => {}, setQty: () => {}, clear: () => {}, open: false, setOpen: () => {},
};
const emptyWish: WishCtx = {
  items: [], count: 0, has: () => false, toggle: () => {}, remove: () => {}, open: false, setOpen: () => {},
};

export function useCart() { return useContext(CartContext) ?? emptyCart; }
export function useWishlist() { return useContext(WishContext) ?? emptyWish; }

// Convenience hook for hydrated count (avoids SSR/CSR mismatch on badge)
export function useHydratedCounts() {
  const cart = useCart();
  const wish = useWishlist();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return {
    cartCount: hydrated ? cart.count : 0,
    wishCount: hydrated ? wish.count : 0,
  };
}

export const _noop = useCallback;
