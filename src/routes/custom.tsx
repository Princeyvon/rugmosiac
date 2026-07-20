import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Nav, Footer, FloatingWhatsApp } from "@/components/site-chrome";
import { submitCustomRequest } from "@/lib/forms.functions";

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Custom Rug Order — Rug Mosiac" },
      { name: "description", content: "Commission a hand-tufted custom rug. Any design, any size — from sketch to doorstep in 3–4 weeks." },
      { property: "og:title", content: "Custom Rug Order — Rug Mosiac" },
      { property: "og:description", content: "Bring us your design. We tuft it in wool." },
    ],
  }),
  component: CustomPage,
});

function CustomPage() {
  const submit = useServerFn(submitCustomRequest);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    const fd = new FormData(e.currentTarget);
    try {
      await submit({
        data: {
          customer_name: String(fd.get("customer_name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          description: String(fd.get("description") ?? ""),
          preferred_size: String(fd.get("preferred_size") ?? ""),
          budget_range: String(fd.get("budget_range") ?? ""),
        },
      });
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="container-x mx-auto max-w-[900px] py-16 md:py-24">
        <span className="eyebrow text-muted-foreground">Custom order</span>
        <h1 className="mt-3 font-serif text-5xl italic tracking-tight md:text-7xl">Design your rug.</h1>
        <p className="mt-6 max-w-xl text-muted-foreground leading-relaxed">
          Bring us anything — a doodle, a photo, a mood. We'll come back with a quote, timeline, and a sample colour palette within 48 hours.
        </p>
        {status === "success" ? (
          <div className="mt-12 rounded-sm border border-accent/40 bg-accent/5 p-8">
            <h2 className="font-serif text-3xl italic">Thank you.</h2>
            <p className="mt-3 text-muted-foreground">We've got your request. Expect a reply within 48 hours.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-12 space-y-6">
            <Field label="Your name" name="customer_name" required />
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Email" name="email" type="email" />
              <Field label="Phone / WhatsApp" name="phone" />
            </div>
            <Field label="Describe your rug" name="description" as="textarea" rows={5} required
              placeholder="Design idea, reference, dimensions, colours, deadline — anything helps." />
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Preferred size" name="preferred_size" placeholder="e.g. 160 × 230 cm" />
              <Field label="Budget range" name="budget_range" placeholder="e.g. 800k – 1.2M RWF" />
            </div>
            {status === "error" && (
              <p className="text-sm text-red-400">{errorMsg || "Could not submit. Please try again."}</p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background disabled:opacity-50"
            >
              {status === "loading" ? "Sending…" : "Submit request"} →
            </button>
          </form>
        )}
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

function Field({
  label, name, type = "text", required, as, rows, placeholder,
}: {
  label: string; name: string; type?: string; required?: boolean;
  as?: "textarea"; rows?: number; placeholder?: string;
}) {
  const base = "mt-2 w-full rounded-sm border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none";
  return (
    <label className="block">
      <span className="eyebrow text-muted-foreground">{label}{required && " *"}</span>
      {as === "textarea" ? (
        <textarea name={name} required={required} rows={rows} placeholder={placeholder} className={base} />
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} className={base} />
      )}
    </label>
  );
}
