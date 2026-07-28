import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Menu, Search, ShoppingBag, X, ChevronDown, ChevronRight, Heart, User } from "lucide-react";
import { listProducts, type Product } from "@/lib/catalogue.functions";
import { CURRENCIES, useCurrency, type Currency } from "@/lib/currency";

export const WHATSAPP_NUMBER = "250796664868";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;


export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.02 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.886 9.885zm8.413-18.297A11.815 11.815 0 0012.02 0C5.495 0 .16 5.335.157 11.892a11.86 11.86 0 001.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.51-8.413z" />
    </svg>
  );
}

export function AnnouncementTicker({ compact = false }: { compact?: boolean }) {
  const msg = "Sign up to our newsletter for 10% off your first order";
  const items = Array.from({ length: 8 });
  if (compact) {
    return (
      <div className="hidden lg:flex items-center overflow-hidden rounded-full bg-foreground text-background max-w-[260px] h-9 px-1">
        <div className="flex gap-10 whitespace-nowrap will-change-transform" style={{ animation: "marquee 32s linear infinite" }}>
          {items.map((_, i) => (
            <span key={i} className="flex items-center gap-10 text-[10px] font-semibold uppercase tracking-[0.18em]">
              {msg}
              <span aria-hidden className="opacity-40">✦</span>
            </span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden bg-marquee text-marquee-foreground">
      <div className="flex gap-16 whitespace-nowrap py-2.5 will-change-transform" style={{ animation: "marquee 42s linear infinite" }}>
        {items.map((_, i) => (
          <span key={i} className="eyebrow flex items-center gap-16">
            {msg}
            <span aria-hidden className="opacity-40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}


const SHOP_LINKS: Array<{ label: string; to: string; search?: { category: string } }> = [
  { label: "Shop All", to: "/catalogue" },
  { label: "Brands", to: "/catalogue", search: { category: "brands" } },
  { label: "Area Rugs", to: "/catalogue", search: { category: "area-rugs" } },
  { label: "Runners", to: "/catalogue", search: { category: "runners" } },
  { label: "Custom", to: "/catalogue", search: { category: "custom" } },
];

function useScrollProgress(range = 360) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setP(Math.max(0, Math.min(1, y / range)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [range]);
  return p;
}


function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Product[] | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    listProducts().then((res) => {
      if (!cancelled) setItems(res as Product[]);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const results = useMemo(() => {
    if (!items) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return items.slice(0, 6);
    return items
      .filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.short_description?.toLowerCase().includes(needle) ||
          p.category?.name.toLowerCase().includes(needle),
      )
      .slice(0, 8);
  }, [items, q]);
  return (
    <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div
        className="mx-auto mt-24 max-w-2xl px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (results[0]) {
              navigate({ to: "/catalogue/$slug", params: { slug: results[0].slug } });
              onClose();
            }
          }}
          className="flex items-center gap-3 border-b-2 border-foreground pb-3"
        >
          <Search className="h-6 w-6" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rugs, categories…"
            className="flex-1 bg-transparent text-2xl outline-none placeholder:text-muted-foreground"
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="p-2">
            <X className="h-5 w-5" />
          </button>
        </form>
        <div className="mt-6 max-h-[60vh] overflow-y-auto">
          {items === null ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No matches. Try another word.</div>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/catalogue/$slug"
                    params={{ slug: p.slug }}
                    onClick={onClose}
                    className="flex items-center gap-4 py-3 transition-opacity hover:opacity-70"
                  >
                    {resolveImage(p.main_image_url) && (
                      <img src={resolveImage(p.main_image_url)} alt="" className="h-14 w-14 rounded-sm object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-base font-medium">{p.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.category?.name ?? "Rug"}
                      </div>
                    </div>
                    <span className="eyebrow text-muted-foreground">View</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const pScroll = useScrollProgress(360);
  // Off the home page the wordmark stays small and centered in the nav —
  // no huge-hero-to-nav shrink animation.
  const p = isHome ? pScroll : 1;
  const scrolled = p > 0.02;

  // Interpolated brand transforms — driven directly by scroll for a seamless
  // "card pushes the wordmark up into the nav" feel. No CSS transition on
  // these values so they track scroll 1:1.
  const size = 220 - (220 - 36) * p; // px — settles a touch larger in the nav
  const top = 150 - (150 - 14) * p; // px from viewport top — more headroom at rest

  const pillCls = `rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-all duration-300 ${
    scrolled ? "bg-background/60 backdrop-blur-md" : "bg-transparent"
  }`;


  return (
    <>
      <header className="sticky top-0 z-40 bg-transparent">
        <div className="container-x mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center py-4">
          {/* Left */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className={`md:hidden -ml-2 p-2 rounded-full transition-all ${scrolled ? "bg-background/60 backdrop-blur-md" : ""}`}
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="hidden md:flex items-center gap-2">
              <div
                className="relative"
                onMouseEnter={() => setShopOpen(true)}
                onMouseLeave={() => setShopOpen(false)}
              >
                <button className={`${pillCls} inline-flex items-center gap-1`}>
                  Shop <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {shopOpen && (
                  <div className="absolute left-0 top-full pt-3">
                    <div className="min-w-[200px] rounded-lg border border-border bg-card/95 p-2 shadow-lg backdrop-blur-md">
                      {SHOP_LINKS.map((l) => (
                        <Link
                          key={l.label}
                          to={l.to}
                          search={l.search as never}
                          className="block rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/story" className={pillCls}>Explore</Link>
              <Link to="/how-it-works" className={pillCls}>About</Link>
            </nav>
          </div>

          {/* Center: placeholder to reserve grid width; actual brand is fixed-positioned overlay below */}
          <div aria-hidden className="h-8 w-32 md:w-44" />

          {/* Right */}
          <div className="flex items-center justify-end gap-2">
            <AnnouncementTicker compact />
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className={`p-2 rounded-full transition-all ${scrolled ? "bg-background/60 backdrop-blur-md" : ""}`}
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              aria-label="Cart"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-all ${scrolled ? "bg-background/60 backdrop-blur-md" : ""}`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline">Cart (0)</span>
            </button>
          </div>
        </div>
      </header>


      {/* Animated brand — fixed, transitions from huge above hero to small nav-center */}
      <Link
        to="/"
        aria-label="Mosiac home"
        className="fixed left-1/2 z-50 -translate-x-1/2 font-script leading-none text-foreground pointer-events-auto"
        style={{
          top: `${top}px`,
          fontSize: `clamp(28px, ${size}px, 22vw)`,
          letterSpacing: "-0.04em",
          textShadow: p < 0.4 ? "0 2px 24px rgba(0,0,0,0.15)" : "none",
        }}
      >
        Mosiac
      </Link>


      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      {/* Mobile menu */}
      {mobileOpen && (
        <MobileMenu onClose={() => setMobileOpen(false)} />
      )}
    </>
  );
}

const MOBILE_SECTIONS: Array<{ label: string; to?: string; search?: { category: string }; children?: Array<{ label: string; to: string; search?: { category: string } }> }> = [
  {
    label: "Featured",
    children: [
      { label: "New Arrivals", to: "/catalogue" },
      { label: "Best Sellers", to: "/catalogue" },
      { label: "Heritage Collection", to: "/catalogue", search: { category: "heritage" } },
    ],
  },
  { label: "Shop by size", to: "/catalogue" },
  { label: "Shop by color", to: "/catalogue" },
  { label: "Shop by style", to: "/catalogue" },
  { label: "Shop by space", to: "/catalogue" },
  { label: "Art & Decor", to: "/catalogue" },
  { label: "Pricing", to: "/how-it-works" },
  { label: "Trade Program", to: "/story" },
];

function MobileMenu({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>("Featured");
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background md:hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="grid h-11 w-11 place-items-center rounded-md bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        <Link to="/" onClick={onClose} className="font-script text-4xl leading-none">
          Mosiac<span className="text-accent">.</span>
        </Link>
        <div className="flex items-center gap-3">
          <button aria-label="Search" className="p-1"><Search className="h-5 w-5" /></button>
          <button aria-label="Wishlist" className="p-1"><Heart className="h-5 w-5" /></button>
          <button aria-label="Cart" className="relative p-1">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-foreground text-[9px] font-semibold text-background">0</span>
          </button>
        </div>
      </div>
      <div className="border-t border-border" />

      {/* Pill row */}
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-4">
        <Link
          to="/catalogue"
          onClick={onClose}
          className="flex items-center justify-between rounded-full border border-border px-5 py-3 text-sm"
        >
          <span>Shop All</span>
          <ShoppingBag className="h-4 w-4" />
        </Link>
        <button className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-3 text-sm">
          RWF <ChevronDown className="h-4 w-4" />
        </button>
        <button aria-label="Account" className="grid h-11 w-11 place-items-center rounded-full border border-border">
          <User className="h-5 w-5" />
        </button>
      </div>
      <div className="border-t border-border" />

      {/* Nav list */}
      <nav className="flex-1 overflow-y-auto px-6 pt-6">
        <ul className="space-y-1">
          {MOBILE_SECTIONS.map((s) => {
            const isOpen = expanded === s.label;
            const hasChildren = !!s.children?.length;
            return (
              <li key={s.label}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => setExpanded(isOpen ? null : s.label)}
                      className="flex w-full items-center justify-between py-4 text-left text-[22px] font-semibold"
                    >
                      <span>{s.label}</span>
                      <ChevronDown className={`h-6 w-6 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <ul className="pb-2 pl-2">
                        {s.children!.map((c) => (
                          <li key={c.label}>
                            <Link
                              to={c.to}
                              search={c.search as never}
                              onClick={onClose}
                              className="block py-2 text-base text-muted-foreground"
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={s.to!}
                    search={s.search as never}
                    onClick={onClose}
                    className="flex items-center justify-between py-4 text-[22px] font-semibold"
                  >
                    <span>{s.label}</span>
                    <ChevronRight className="h-6 w-6" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom wordmark */}
      <div className="flex items-end justify-center pb-8 pt-4">
        <Link to="/" onClick={onClose} className="font-script text-6xl leading-none">
          Mosiac<span className="text-accent">.</span>
        </Link>
      </div>
    </div>
  );
}

function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border md:border-none">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left md:cursor-default md:py-0"
      >
        <span className="eyebrow text-foreground">{title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform md:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`${open ? "block" : "hidden"} pb-4 md:block md:pb-0 md:pt-4`}>{children}</div>
    </div>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-[3px] border border-border bg-card px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background pt-16 pb-8">
      <div className="container-x mx-auto max-w-[1400px]">
        <div className="grid gap-8 md:grid-cols-[1fr_1fr_1fr_2fr] md:gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="font-script text-3xl">Mosiac</Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              We dream up rugs that bring otherworldly comfort to the home. Hand-tufted in Kigali since 2021.
            </p>
            <p className="mt-6 text-xs text-muted-foreground">© 2025 Mosiac</p>
          </div>

          {/* About */}
          <FooterAccordion title="About">
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/story" className="transition-opacity hover:opacity-60">About Us</Link></li>
              <li><a href="https://instagram.com/rugmosiac" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-60">Instagram</a></li>
              <li><Link to="/how-it-works" className="transition-opacity hover:opacity-60">Stockists</Link></li>
            </ul>
          </FooterAccordion>

          {/* Support */}
          <FooterAccordion title="Support">
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/contact" className="transition-opacity hover:opacity-60">Contact</Link></li>
              <li><Link to="/custom" className="transition-opacity hover:opacity-60">Custom</Link></li>
              <li><Link to="/custom" className="transition-opacity hover:opacity-60">Samples</Link></li>
              <li><Link to="/how-it-works" className="transition-opacity hover:opacity-60">FAQ</Link></li>
            </ul>
          </FooterAccordion>

          {/* Newsletter */}
          <div>
            <div className="eyebrow text-foreground">Get 10% off</div>
            <p className="mt-3 text-sm text-muted-foreground">
              Join the list for early access to drops and a 10% welcome discount on your first order.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-4 flex items-center gap-0 border border-border bg-card focus-within:border-foreground transition-colors"
            >
              <input
                type="email"
                required
                placeholder="Email address"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="h-full whitespace-nowrap bg-foreground px-5 py-3 text-xs font-semibold uppercase tracking-wider text-background transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Join
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs">
                <span className="eyebrow text-muted-foreground">Currency</span>
                <select className="border border-border bg-card px-2 py-1.5 text-xs" defaultValue="USD">
                  <option>USD</option>
                  <option>RWF</option>
                  <option>EUR</option>
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                <PaymentBadge label="Visa" />
                <PaymentBadge label="Amex" />
                <PaymentBadge label="Apple" />
                <PaymentBadge label="PayPal" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <span>Kigali, Rwanda · Made to order</span>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition-opacity hover:opacity-60">
            <WhatsAppIcon className="h-3.5 w-3.5" /> +250 780 000 000
          </a>
        </div>
      </div>
    </footer>
  );
}

export function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Order on WhatsApp"
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-2xl shadow-black/20 transition-transform hover:scale-110"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}

export function formatPrice({ rwf, usd }: { rwf?: number | null; usd?: number | null }) {
  if (rwf) return `${rwf.toLocaleString()} RWF`;
  if (usd) return `$${Number(usd).toLocaleString()}`;
  return "Price on request";
}

const bundledAssets = import.meta.glob("/src/assets/*.{jpg,png,webp,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export function resolveImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/src/assets/")) return bundledAssets[url];
  return url;
}
