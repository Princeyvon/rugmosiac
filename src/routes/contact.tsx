import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Nav, Footer, FloatingWhatsApp, WhatsAppIcon, WHATSAPP_URL } from "@/components/site-chrome";
import { NewsletterWeekly } from "@/components/blocks";
import { submitContact } from "@/lib/forms.functions";
import contactHero from "@/assets/contact-hero.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Mosiac — Hand-Tufted Rugs, Kigali" },
      { name: "description", content: "Talk to the Mosiac studio about a custom rug, sizing, or an order in progress. WhatsApp, email, or send us a note." },
      { property: "og:title", content: "Contact Mosiac — Hand-Tufted Rugs, Kigali" },
      { property: "og:description", content: "Talk to the Mosiac studio about a custom rug, sizing, or an order in progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const FIELD =
  "w-full border-0 border-b border-border bg-transparent px-0 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground";

function ContactPage() {
  const submit = useServerFn(submitContact);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    try {
      await submit({
        data: {
          name: `${String(fd.get("first") ?? "")} ${String(fd.get("last") ?? "")}`.trim(),
          email: String(fd.get("email") ?? ""),
          subject: String(fd.get("subject") ?? ""),
          message: `${String(fd.get("message") ?? "")}${fd.get("phone") ? `\n\nPhone: ${fd.get("phone")}` : ""}`,
        },
      });
      setStatus("success");
      form.reset();
    } catch (e2) {
      setStatus("error");
      setErr(e2 instanceof Error ? e2.message : "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <section className="container-x mx-auto max-w-[1200px] pt-12 pb-16 md:pt-16 md:pb-24">
          <div className="grid gap-14 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
            <div>
              <span className="eyebrow text-muted-foreground">Contact us</span>
              <h1 className="mt-4 font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-6xl">
                Let's make something<br />
                <span className="italic">for your floor</span>.
              </h1>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Whether it's a custom commission, a sizing question, or an order already on the loom — the studio reads
                every message and replies within one working day.
              </p>
            </div>

            {status === "success" ? (
              <div className="self-start rounded-2xl border border-border bg-muted/50 p-10">
                <h2 className="font-display text-3xl">Message received.</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Thank you — we'll be in touch within one working day. Need us sooner? WhatsApp is fastest.
                </p>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-medium text-whatsapp-foreground"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Message the studio
                </a>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-8">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first" className="eyebrow text-muted-foreground">First name</label>
                    <input id="first" name="first" required placeholder="Jane" className={FIELD} />
                  </div>
                  <div>
                    <label htmlFor="last" className="eyebrow text-muted-foreground">Last name</label>
                    <input id="last" name="last" placeholder="Uwase" className={FIELD} />
                  </div>
                  <div>
                    <label htmlFor="email" className="eyebrow text-muted-foreground">Email</label>
                    <input id="email" name="email" type="email" required placeholder="you@example.com" className={FIELD} />
                  </div>
                  <div>
                    <label htmlFor="phone" className="eyebrow text-muted-foreground">Phone (optional)</label>
                    <input id="phone" name="phone" placeholder="+250 …" className={FIELD} />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="eyebrow text-muted-foreground">Subject</label>
                  <input id="subject" name="subject" placeholder="Custom rug enquiry" className={FIELD} />
                </div>
                <div>
                  <label htmlFor="message" className="eyebrow text-muted-foreground">Message</label>
                  <textarea id="message" name="message" required rows={4} placeholder="Tell us about the space, the size, and the feeling you're after." className={FIELD} />
                </div>
                {status === "error" && <p className="text-sm text-destructive">{err}</p>}
                <button
                  disabled={status === "loading"}
                  className="w-full rounded-full bg-foreground px-8 py-4 text-xs font-semibold uppercase tracking-wider text-background transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-12"
                >
                  {status === "loading" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="container-x mx-auto max-w-[1200px]">
          <div className="overflow-hidden rounded-2xl bg-muted">
            <img
              src={contactHero}
              alt="Warm dunes — the palette behind the Mosiac studio"
              loading="lazy"
              width={1920}
              height={720}
              className="h-[240px] w-full object-cover md:h-[420px]"
            />
          </div>
        </section>

        <section className="container-x mx-auto max-w-[1200px] py-16 md:py-24">
          <div className="grid gap-10 border-t border-border pt-12 md:grid-cols-3">
            <div>
              <div className="eyebrow text-muted-foreground">Call / WhatsApp</div>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-3 block font-display text-xl hover:text-accent">
                +250 796 664 868
              </a>
              <p className="mt-2 text-sm text-muted-foreground">Fastest route to the studio.</p>
            </div>
            <div>
              <div className="eyebrow text-muted-foreground">Studio hours</div>
              <p className="mt-3 font-display text-xl">Mon–Fri, 8:00–18:00</p>
              <p className="mt-2 text-sm text-muted-foreground">Kigali, Rwanda · visits by appointment.</p>
            </div>
            <div>
              <div className="eyebrow text-muted-foreground">Email</div>
              <a href="mailto:hello@rugmosiac.com" className="mt-3 block font-display text-xl hover:text-accent">
                hello@rugmosiac.com
              </a>
              <p className="mt-2 text-sm text-muted-foreground">
                Orders: <a href="mailto:orders@rugmosiac.com" className="underline underline-offset-4">orders@rugmosiac.com</a>
              </p>
            </div>
          </div>
        </section>

        <NewsletterWeekly />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
