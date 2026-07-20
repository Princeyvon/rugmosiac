import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const WHATSAPP_URL = "https://wa.me/250780000000";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.02 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.886 9.885zm8.413-18.297A11.815 11.815 0 0012.02 0C5.495 0 .16 5.335.157 11.892a11.86 11.86 0 001.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.51-8.413z" />
    </svg>
  );
}

export function Nav({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const solid = !transparent || scrolled;
  return (
    <>
      <div className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container-x mx-auto max-w-[1400px] py-2.5 text-center">
          <p className="eyebrow text-muted-foreground">
            Handmade in Kigali · Made to order · Any design, yours forever
          </p>
        </div>
      </div>
      <header
        className={`sticky top-0 z-40 transition-colors duration-300 ${
          solid ? "bg-background/95 backdrop-blur border-b border-border/60" : "bg-transparent"
        }`}
      >
        <div className="container-x mx-auto flex max-w-[1400px] items-center justify-between py-5">
          <Link to="/" className="font-serif text-2xl italic tracking-tight">
            Rug Mosiac
          </Link>
          <nav className="hidden items-center gap-9 text-sm md:flex">
            <Link to="/catalogue" className="hover:text-accent transition-colors">Catalogue</Link>
            <Link to="/how-it-works" className="hover:text-accent transition-colors">How It Works</Link>
            <Link to="/story" className="hover:text-accent transition-colors">Our Story</Link>
            <Link to="/custom" className="hover:text-accent transition-colors">Custom</Link>
            <Link to="/contact" className="hover:text-accent transition-colors">Contact</Link>
          </nav>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2 text-sm font-medium text-whatsapp-foreground transition-transform hover:scale-[1.03]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-16">
      <div className="container-x mx-auto max-w-[1400px]">
        <div className="text-center">
          <Link to="/" className="font-serif text-3xl italic">Rug Mosiac</Link>
        </div>
        <div className="mt-14 grid gap-10 text-sm md:grid-cols-4">
          <div>
            <div className="eyebrow text-muted-foreground">Shop</div>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/catalogue" className="hover:text-accent">Catalogue</Link></li>
              <li><Link to="/custom" className="hover:text-accent">Custom order</Link></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow text-muted-foreground">Company</div>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/story" className="hover:text-accent">Our Story</Link></li>
              <li><Link to="/how-it-works" className="hover:text-accent">How It Works</Link></li>
              <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow text-muted-foreground">Connect</div>
            <ul className="mt-4 space-y-2.5">
              <li><a href="https://instagram.com/rugmosiac" target="_blank" rel="noreferrer" className="hover:text-accent">Instagram</a></li>
              <li><a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hover:text-accent">+250 780 000 000</a></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow text-muted-foreground">Order</div>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              All orders confirmed via WhatsApp. Size, design, and delivery agreed before we begin.
            </p>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2 text-xs font-medium text-whatsapp-foreground">
              <WhatsAppIcon className="h-3.5 w-3.5" />
              Start an order
            </a>
          </div>
        </div>
        <div className="mt-14 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © 2025 Rug Mosiac · Kigali, Rwanda
        </div>
      </div>
    </footer>
  );
}

export function FloatingWhatsApp() {
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Order on WhatsApp" className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-2xl shadow-black/40 transition-transform hover:scale-110">
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}

export function formatPrice({ rwf, usd }: { rwf?: number | null; usd?: number | null }) {
  if (rwf) return `${rwf.toLocaleString()} RWF`;
  if (usd) return `$${Number(usd).toLocaleString()}`;
  return "Price on request";
}
