import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Phone } from "lucide-react";
import { subscribeNewsletter, submitContact } from "@/lib/forms.functions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import craft1 from "@/assets/craft-1.jpg";
import ig2 from "@/assets/ig-2.jpg";

/** Weekly newsletter callout with two imagery cards. */
export function NewsletterWeekly() {
  const subscribe = useServerFn(subscribeNewsletter);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [code, setCode] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    if (!email) return;
    setStatus("loading");
    try {
      const res = (await subscribe({ data: { email } })) as { code?: string | null } | null;
      setCode(res?.code ?? null);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="container-x mx-auto max-w-[1300px] py-16 md:py-24">
      <div className="grid items-center gap-10 rounded-3xl bg-muted p-7 md:p-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="inline-block rounded-full bg-background px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Stay connected
          </span>
          <h2 className="mt-5 font-display text-3xl font-medium leading-tight tracking-tight md:text-5xl">
            Join our weekly newsletter &amp; design updates
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
            Subscribe to get exclusive previews of new rug collections, behind-the-scenes artisan stories, and interior styling guides.
          </p>

          {status === "done" ? (
            <div className="mt-7 rounded-2xl border border-border bg-background p-5">
              <p className="font-display text-lg">You're on the list.</p>
              {code && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Use code <span className="font-semibold text-foreground">{code}</span> for 10% off your first order.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="h-12 flex-1 rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-foreground"
              />
              <button
                disabled={status === "loading"}
                className="h-12 shrink-0 rounded-full bg-foreground px-7 text-xs font-semibold uppercase tracking-wider text-background disabled:opacity-50"
              >
                {status === "loading" ? "Joining…" : "Subscribe"}
              </button>
            </form>
          )}
          {status === "error" && <p className="mt-3 text-sm text-red-500">Something went wrong. Try again.</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <img src={craft1} alt="Close-up of hand-knotted rug texture" loading="lazy" className="aspect-[3/4] w-full rounded-2xl object-cover" />
          <img src={ig2} alt="A finished Mosiac rug laid out in a modern home" loading="lazy" className="aspect-[3/4] w-full rounded-2xl object-cover" />
        </div>
      </div>
    </section>
  );
}

/** Request-callback overlay form. */
export function RequestCallback({ className = "" }: { className?: string }) {
  const submit = useServerFn(submitContact);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await submit({
        data: {
          name: String(fd.get("name") ?? "Callback request"),
          email: String(fd.get("email") ?? "callback@rugmosiac.com"),
          subject: "Callback request",
          message: `Please call me back on ${String(fd.get("phone") ?? "")}. ${String(fd.get("note") ?? "")}`,
        },
      });
      setSent(true);
    } catch {
      setSent(true);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={`group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider text-background ${className}`}
        >
          <Phone className="h-4 w-4" /> Request callback
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Request a callback</DialogTitle>
        </DialogHeader>
        {sent ? (
          <p className="text-sm text-muted-foreground">Thanks — our team will ring you within 24 hours.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input name="name" required placeholder="Your name" className="h-12 w-full rounded-xl border border-border bg-muted px-4 text-sm" />
            <input name="phone" required placeholder="+250 788 000 000" className="h-12 w-full rounded-xl border border-border bg-muted px-4 text-sm" />
            <input name="email" type="email" required placeholder="you@example.com" className="h-12 w-full rounded-xl border border-border bg-muted px-4 text-sm" />
            <textarea name="note" rows={3} placeholder="What would you like to talk about?" className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm" />
            <button className="h-12 w-full rounded-full bg-foreground text-xs font-semibold uppercase tracking-wider text-background">
              Request callback
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** FAQ block with a "still have questions?" side card. */
export function FaqBlock({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <section className="container-x mx-auto max-w-[1300px] py-16 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <h2 className="font-display text-4xl font-medium tracking-tight md:text-6xl">FAQ</h2>
          <div className="mt-8 rounded-2xl bg-muted p-6">
            <p className="font-display text-lg">Still have questions?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Talk to a rug specialist about sizing, colours, or a custom commission.
            </p>
            <RequestCallback className="mt-5" />
          </div>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-base font-medium">{it.q}</AccordionTrigger>
              <AccordionContent className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function ArrowPill({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="submit" onClick={onClick} className="rounded-full bg-foreground px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-background">
        {label}
      </button>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-foreground text-background">
        <ArrowUpRight className="h-5 w-5" />
      </span>
    </div>
  );
}
