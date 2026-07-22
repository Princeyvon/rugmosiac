import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, X, ChevronDown } from "lucide-react";

export const WHATSAPP_URL = "https://wa.me/250780000000";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.02 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.886 9.885zm8.413-18.297A11.815 11.815 0 0012.02 0C5.495 0 .16 5.335.157 11.892a11.86 11.86 0 001.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.51-8.413z" />
    </svg>
  );
}

export function AnnouncementTicker() {
  const msg = "Sign up to our newsletter for 10% off your first order";
  const items = Array.from({ length: 8 });
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
  { label: "Sports", to: "/catalogue", search: { category: "sports" } },
  { label: "Cartoon", to: "/catalogue", search: { category: "cartoon" } },
  { label: "Animals", to: "/catalogue", search: { category: "animals" } },
  { label: "Custom", to: "/catalogue", search: { category: "custom" } },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <AnnouncementTicker />
      <header
        className={`sticky top-0 z-40 bg-background transition-shadow duration-300 ${scrolled ? "shadow-[0_1px_0_0_var(--color-border)]" : ""}`}
      >
        <div className="container-x mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center py-4">
          {/* Left */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="md:hidden -ml-2 p-2"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium tracking-wide">
              <div
                className="relative"
                onMouseEnter={() => setShopOpen(true)}
                onMouseLeave={() => setShopOpen(false)}
              >
                <button className="inline-flex items-center gap-1 uppercase transition-opacity hover:opacity-60">
                  Shop <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {shopOpen && (
                  <div className="absolute left-0 top-full pt-3">
                    <div className="min-w-[180px] rounded-sm border border-border bg-card p-2 shadow-lg">
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
              <Link to="/story" className="uppercase transition-opacity hover:opacity-60">Explore</Link>
              <Link to="/how-it-works" className="uppercase transition-opacity hover:opacity-60">About</Link>
            </nav>
          </div>

          {/* Center */}
          <Link to="/" className="justify-self-center font-display text-xl font-semibold tracking-tight md:text-2xl">
            Rug Mosiac
          </Link>

          {/* Right */}
          <div className="flex items-center justify-end gap-2 md:gap-4">
            <button aria-label="Search" className="p-2 transition-opacity hover:opacity-60">
              <Search className="h-5 w-5" />
            </button>
            <button
              aria-label="Cart"
              className="inline-flex items-center gap-2 p-2 text-[13px] font-medium uppercase tracking-wide transition-opacity hover:opacity-60"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline">Cart (0)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="font-display text-xl font-semibold">Rug Mosiac</span>
            <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-2">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col divide-y divide-border">
            {SHOP_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                search={l.search as never}
                onClick={() => setMobileOpen(false)}
                className="px-6 py-4 text-base"
              >
                {l.label}
              </Link>
            ))}
            <Link to="/story" onClick={() => setMobileOpen(false)} className="px-6 py-4 text-base uppercase tracking-wide">Explore</Link>
            <Link to="/how-it-works" onClick={() => setMobileOpen(false)} className="px-6 py-4 text-base uppercase tracking-wide">About</Link>
            <Link to="/contact" onClick={() => setMobileOpen(false)} className="px-6 py-4 text-base uppercase tracking-wide">Contact</Link>
          </nav>
        </div>
      )}
    </>
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
            <Link to="/" className="font-display text-xl font-semibold tracking-tight">Rug Mosiac</Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              We dream up rugs that bring otherworldly comfort to the home. Hand-tufted in Kigali since 2021.
            </p>
            <p className="mt-6 text-xs text-muted-foreground">© 2025 Rug Mosiac</p>
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
