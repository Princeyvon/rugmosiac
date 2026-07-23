import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Nav, Footer, FloatingWhatsApp, WhatsAppIcon, WHATSAPP_URL } from "@/components/site-chrome";
import { submitContact } from "@/lib/forms.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Mosiac" },
      { name: "description", content: "Get in touch with Mosiac — Kigali's hand-tufted rug studio." },
      { property: "og:title", content: "Contact — Mosiac" },
      { property: "og:description", content: "Message us on WhatsApp or drop a note." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const submit = useServerFn(submitContact);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    try {
      await submit({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          subject: String(fd.get("subject") ?? ""),
          message: String(fd.get("message") ?? ""),
        },
      });
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch (e2) {
      setStatus("error");
      setErr(e2 instanceof Error ? e2.message : "Failed");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container-x mx-auto max-w-[1100px] py-16 md:py-24">
        <span className="eyebrow text-muted-foreground">Say hello</span>
        <h1 className="mt-3 font-serif text-5xl italic tracking-tight md:text-7xl">Let's talk rugs.</h1>
        <div className="mt-14 grid gap-14 md:grid-cols-[1fr_1.2fr]">
          <div className="space-y-8">
            <div>
              <div className="eyebrow text-muted-foreground">WhatsApp</div>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-3 text-sm font-medium text-whatsapp-foreground">
                <WhatsAppIcon className="h-4 w-4" /> +250 780 000 000
              </a>
              <p className="mt-3 text-sm text-muted-foreground">Fastest way to reach us. Usually reply within an hour.</p>
            </div>
            <div>
              <div className="eyebrow text-muted-foreground">Studio</div>
              <p className="mt-3">Kigali, Rwanda</p>
              <p className="text-sm text-muted-foreground">Visits by appointment</p>
            </div>
            <div>
              <div className="eyebrow text-muted-foreground">Instagram</div>
              <a href="https://instagram.com/rugmosiac" target="_blank" rel="noreferrer" className="mt-3 inline-block hover:text-accent">
                @rugmosiac →
              </a>
            </div>
          </div>
          {status === "success" ? (
            <div className="rounded-sm border border-accent/40 bg-accent/5 p-8">
              <h2 className="font-serif text-3xl italic">Message received.</h2>
              <p className="mt-3 text-muted-foreground">We'll reply within 48 hours.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <input name="name" required placeholder="Your name" className="w-full rounded-sm border border-border bg-card px-4 py-3" />
              <input name="email" type="email" required placeholder="Email" className="w-full rounded-sm border border-border bg-card px-4 py-3" />
              <input name="subject" placeholder="Subject (optional)" className="w-full rounded-sm border border-border bg-card px-4 py-3" />
              <textarea name="message" required rows={6} placeholder="Message" className="w-full rounded-sm border border-border bg-card px-4 py-3" />
              {status === "error" && <p className="text-sm text-red-400">{err || "Failed. Try again."}</p>}
              <button disabled={status === "loading"} className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background disabled:opacity-50">
                {status === "loading" ? "Sending…" : "Send message"} →
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
