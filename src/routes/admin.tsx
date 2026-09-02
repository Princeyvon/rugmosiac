import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Upload, X, LogOut, Star, Check } from "lucide-react";
import {
  adminStatus,
  adminLogin,
  adminLogout,
  adminLoadCatalogue,
  adminSaveProduct,
  adminDeleteProduct,
  adminUploadImage,
} from "@/lib/admin.functions";
import { resolveImage } from "@/components/site-chrome";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Studio Dashboard | Mosiac" },
      { name: "description", content: "Password protected dashboard for managing the Mosiac rug catalogue, pricing, stock and imagery." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Studio Dashboard | Mosiac" },
      { property: "og:description", content: "Internal catalogue management for the Mosiac studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

// ---------- types ----------

type SizeRow = {
  label: string;
  width_cm: number | null;
  height_cm: number | null;
  price_rwf: number | null;
  weight_kg: number | null;
  sort_order: number;
};

type Draft = {
  id?: string;
  slug: string;
  name: string;
  sku: string;
  category_id: string | null;
  shape: "rectangle" | "circular" | "runner" | "organic";
  short_description: string;
  description: string;
  care_instructions: string;
  seo_title: string;
  seo_description: string;
  stock_status: "in_stock" | "made_to_order" | "out_of_stock";
  fulfilment_type: "ready_to_ship" | "made_to_order" | "custom";
  stock_qty: number;
  low_stock_threshold: number;
  production_time: string;
  material: string;
  featured: boolean;
  featured_order: number;
  is_published: boolean;
  main_image_url: string | null;
  hover_image_url: string | null;
  color_palette: string[];
  tags: string[];
  base_price_rwf: number | null;
  cost_rwf: number | null;
  sizes: SizeRow[];
  images: Array<{ url: string; alt: string | null }>;
};

const SHAPES = ["rectangle", "circular", "runner", "organic"] as const;
const STOCK: Array<{ value: Draft["stock_status"]; label: string }> = [
  { value: "in_stock", label: "In stock" },
  { value: "made_to_order", label: "Made to order" },
  { value: "out_of_stock", label: "Sold out" },
];

const DEFAULT_LADDER: Record<string, SizeRow[]> = {
  rectangle: [
    { label: "S", width_cm: 120, height_cm: 180, price_rwf: 320000, weight_kg: 8.2, sort_order: 0 },
    { label: "M", width_cm: 150, height_cm: 220, price_rwf: 480000, weight_kg: 12.5, sort_order: 1 },
    { label: "L", width_cm: 200, height_cm: 300, price_rwf: 870000, weight_kg: 22.8, sort_order: 2 },
  ],
  circular: [
    { label: "S", width_cm: 120, height_cm: 120, price_rwf: 170000, weight_kg: 4.3, sort_order: 0 },
    { label: "M", width_cm: 140, height_cm: 140, price_rwf: 230000, weight_kg: 5.9, sort_order: 1 },
    { label: "L", width_cm: 160, height_cm: 160, price_rwf: 290000, weight_kg: 7.6, sort_order: 2 },
  ],
  runner: [
    { label: "S", width_cm: 60, height_cm: 220, price_rwf: 190000, weight_kg: 5.0, sort_order: 0 },
    { label: "M", width_cm: 60, height_cm: 320, price_rwf: 280000, weight_kg: 7.3, sort_order: 1 },
    { label: "L", width_cm: 80, height_cm: 300, price_rwf: 350000, weight_kg: 9.1, sort_order: 2 },
  ],
  organic: [
    { label: "Standard", width_cm: 220, height_cm: 150, price_rwf: 480000, weight_kg: 12.5, sort_order: 0 },
  ],
};

/** Weight in kg = rug area in square metres multiplied by 3.8. */
function autoWeight(shape: string, w: number | null, h: number | null): number | null {
  if (!w) return null;
  const area = shape === "circular" ? Math.PI * (w / 200) ** 2 : h ? (w / 100) * (h / 100) : null;
  if (!area) return null;
  return Math.round(area * 3.8 * 10) / 10;
}

function emptyDraft(): Draft {
  return {
    slug: "",
    name: "",
    sku: "",
    care_instructions: "",
    seo_title: "",
    seo_description: "",
    fulfilment_type: "made_to_order",
    stock_qty: 0,
    low_stock_threshold: 2,
    cost_rwf: null,
    category_id: null,
    shape: "rectangle",
    short_description: "",
    description: "",
    stock_status: "made_to_order",
    production_time: "Ready in 3 to 4 weeks",
    material: "Hand-tufted New Zealand wool",
    featured: false,
    featured_order: 50,
    is_published: true,
    main_image_url: null,
    hover_image_url: null,
    color_palette: [],
    tags: [],
    base_price_rwf: 320000,
    sizes: DEFAULT_LADDER.rectangle.map((s) => ({ ...s })),
    images: [],
  };
}

// ---------- styles ----------

const input =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-foreground";
const label = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

// ---------- page ----------

function AdminPage() {
  const status = useServerFn(adminStatus);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    status().then((r) => setSignedIn(r.signedIn)).catch(() => setSignedIn(false));
  }, [status]);

  if (signedIn === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  return signedIn ? <Dashboard onSignOut={() => setSignedIn(false)} /> : <LoginGate onDone={() => setSignedIn(true)} />;
}

function LoginGate({ onDone }: { onDone: () => void }) {
  const login = useServerFn(adminLogin);
  const [pw, setPw] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "bad">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await login({ data: { password: pw } });
      if (res.ok) onDone();
      else setState("bad");
    } catch {
      setState("bad");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="font-script text-6xl leading-none">Mosiac</div>
        <h1 className="mt-6 font-display text-2xl font-medium">Studio dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter the studio password to manage the catalogue.</p>
        <input
          autoFocus
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setState("idle");
          }}
          placeholder="Password"
          className={`${input} mt-6`}
        />
        {state === "bad" && <p className="mt-3 text-sm text-destructive">That password is not right.</p>}
        <button
          disabled={state === "busy"}
          className="mt-5 h-12 w-full rounded-full bg-foreground text-xs font-semibold uppercase tracking-wider text-background disabled:opacity-50"
        >
          {state === "busy" ? "Checking" : "Enter dashboard"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const load = useServerFn(adminLoadCatalogue);
  const logout = useServerFn(adminLogout);
  const save = useServerFn(adminSaveProduct);
  const remove = useServerFn(adminDeleteProduct);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await load();
    setProducts(res.products);
    setCategories(res.categories as any);
    setLoading(false);
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function edit(p: any) {
    setDraft({
      id: p.id,
      slug: p.slug,
      name: p.name,
      sku: p.sku ?? "",
      care_instructions: p.care_instructions ?? "",
      seo_title: p.seo_title ?? "",
      seo_description: p.seo_description ?? "",
      fulfilment_type: p.fulfilment_type ?? "made_to_order",
      stock_qty: p.stock_qty ?? 0,
      low_stock_threshold: p.low_stock_threshold ?? 2,
      cost_rwf: p.cost_rwf ?? null,
      category_id: p.category_id,
      shape: p.shape,
      short_description: p.short_description ?? "",
      description: p.description ?? "",
      stock_status: p.stock_status,
      production_time: p.production_time ?? "",
      material: p.material ?? "",
      featured: p.featured,
      featured_order: p.featured_order ?? 50,
      is_published: p.is_published,
      main_image_url: p.main_image_url,
      hover_image_url: p.hover_image_url,
      color_palette: p.color_palette ?? [],
      tags: p.tags ?? [],
      base_price_rwf: p.base_price_rwf,
      sizes: (p.sizes ?? [])
        .slice()
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((s: any, i: number) => ({
          label: s.label,
          width_cm: s.width_cm,
          height_cm: s.height_cm,
          price_rwf: s.price_rwf,
          weight_kg: s.weight_kg,
          sort_order: i,
        })),
      images: (p.images ?? [])
        .slice()
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((i: any) => ({ url: i.url, alt: i.alt })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await save({ data: draft as any });
      setToast("Saved. The website is updated.");
      setDraft(null);
      await refresh();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" from the website? This cannot be undone.`)) return;
    await remove({ data: { id } });
    setToast("Rug deleted.");
    await refresh();
  }

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container-x mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-script text-3xl leading-none">Mosiac</span>
            <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Studio dashboard
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setDraft(emptyDraft())}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-background"
            >
              <Plus className="h-4 w-4" /> New rug
            </button>
            <button
              onClick={async () => {
                await logout();
                onSignOut();
              }}
              aria-label="Sign out"
              className="grid h-10 w-10 place-items-center rounded-full border border-border"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-6 py-3 text-sm text-background shadow-xl">
          {toast}
        </div>
      )}

      <main className="container-x mx-auto max-w-[1400px] py-8">
        <div className="flex flex-wrap gap-2">
          {(["catalogue", "promotions", "orders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-wider capitalize ${
                tab === t ? "border-foreground bg-foreground text-background" : "border-border"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "promotions" && <CouponsPanel onToast={setToast} />}
        {tab === "orders" && <OrdersPanel onToast={setToast} />}

        {tab === "catalogue" && (
          <>
            {draft && (
              <div className="mt-6">
                <ProductForm
                  draft={draft}
                  setDraft={setDraft}
                  categories={categories}
                  saving={saving}
                  onSave={onSave}
                  onCancel={() => setDraft(null)}
                />
              </div>
            )}

            <h2 className="mt-10 font-display text-xl font-medium">
              Catalogue <span className="text-muted-foreground">({products.length})</span>
            </h2>
            {loading ? (
              <div className="py-20 text-center text-muted-foreground">Loading the catalogue…</div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-none lg:grid-cols-[56px_minmax(0,1fr)_150px_130px_auto]"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {resolveImage(p.main_image_url) && (
                        <img src={resolveImage(p.main_image_url)} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display text-base font-medium">{p.name}</span>
                        {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-current text-accent" />}
                        {(p.tags ?? []).includes("new") && (
                          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider">
                            New
                          </span>
                        )}
                        {!p.is_published && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Chip on={p.is_published} onClick={() => quick(p.id, { is_published: !p.is_published })}>
                          {p.is_published ? "Visible" : "Hidden"}
                        </Chip>
                        <Chip
                          on={p.stock_status === "out_of_stock"}
                          onClick={() =>
                            quick(p.id, {
                              stock_status: p.stock_status === "out_of_stock" ? "made_to_order" : "out_of_stock",
                            })
                          }
                        >
                          {p.stock_status === "out_of_stock" ? "Sold out" : "Mark sold out"}
                        </Chip>
                        <Chip on={p.featured} onClick={() => quick(p.id, { featured: !p.featured })}>
                          Featured
                        </Chip>
                        <Chip
                          on={(p.tags ?? []).includes("new")}
                          onClick={() => quick(p.id, { newArrival: !(p.tags ?? []).includes("new") })}
                        >
                          New arrival
                        </Chip>
                      </div>
                    </div>
                    <div className="hidden text-xs text-muted-foreground lg:block">
                      {STOCK.find((s) => s.value === p.stock_status)?.label}
                      <div className="mt-1">{(p.sizes ?? []).length} sizes · {(p.color_palette ?? []).length} colours</div>
                    </div>
                    <div className="hidden text-xs lg:block">
                      {p.base_price_rwf ? `${Number(p.base_price_rwf).toLocaleString()} RWF` : "On request"}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => edit(p)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold">
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(p.id, p.name)}
                        aria-label={`Delete ${p.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}

// ---------- form ----------

function ProductForm({
  draft,
  setDraft,
  categories,
  saving,
  onSave,
  onCancel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  categories: Array<{ id: string; name: string; slug: string }>;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v });

  return (
    <section className="rounded-3xl border border-border bg-background p-5 md:p-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <h2 className="truncate font-display text-2xl font-medium">
          {draft.id ? `Editing ${draft.name}` : "New rug"}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={onCancel} className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-wider">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-background disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Publish changes
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Basics */}
        <div className="space-y-5">
          <div>
            <span className={label}>Rug name</span>
            <input className={`${input} mt-1.5`} value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={label}>URL slug</span>
              <input
                className={`${input} mt-1.5`}
                placeholder="auto from name"
                value={draft.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </div>
            <div>
              <span className={label}>Collection</span>
              <select
                className={`${input} mt-1.5`}
                value={draft.category_id ?? ""}
                onChange={(e) => set("category_id", e.target.value || null)}
              >
                <option value="">No collection</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={label}>Shape</span>
              <select
                className={`${input} mt-1.5`}
                value={draft.shape}
                onChange={(e) => {
                  const shape = e.target.value as Draft["shape"];
                  setDraft({ ...draft, shape, sizes: DEFAULT_LADDER[shape].map((s) => ({ ...s })) });
                }}
              >
                {SHAPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <span className={label}>Availability</span>
              <select
                className={`${input} mt-1.5`}
                value={draft.stock_status}
                onChange={(e) => set("stock_status", e.target.value as Draft["stock_status"])}
              >
                {STOCK.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={label}>Lead time</span>
              <input className={`${input} mt-1.5`} value={draft.production_time} onChange={(e) => set("production_time", e.target.value)} />
            </div>
            <div>
              <span className={label}>Material</span>
              <input className={`${input} mt-1.5`} value={draft.material} onChange={(e) => set("material", e.target.value)} />
            </div>
          </div>
          <div>
            <span className={label}>Card summary</span>
            <input className={`${input} mt-1.5`} value={draft.short_description} onChange={(e) => set("short_description", e.target.value)} />
          </div>
          <div>
            <span className={label}>Full description</span>
            <textarea rows={4} className={`${input} mt-1.5`} value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <span className={label}>Care instructions</span>
            <textarea rows={3} className={`${input} mt-1.5`} value={draft.care_instructions} onChange={(e) => set("care_instructions", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TokenField
              title="Tags"
              hint="circular, runner, blue, bestseller"
              values={draft.tags}
              onChange={(v) => set("tags", v)}
            />
            <TokenField
              title="Colours"
              hint="#2B7FC4"
              swatches
              values={draft.color_palette}
              onChange={(v) => set("color_palette", v)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className={label}>From price (RWF)</span>
              <input
                type="number"
                className={`${input} mt-1.5`}
                value={draft.base_price_rwf ?? ""}
                onChange={(e) => set("base_price_rwf", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div>
              <span className={label}>Cost price (RWF)</span>
              <input
                type="number"
                className={`${input} mt-1.5`}
                value={draft.cost_rwf ?? ""}
                onChange={(e) => set("cost_rwf", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div>
              <span className={label}>Featured order</span>
              <input
                type="number"
                className={`${input} mt-1.5`}
                value={draft.featured_order}
                onChange={(e) => set("featured_order", Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className={label}>SKU</span>
              <input className={`${input} mt-1.5`} value={draft.sku} onChange={(e) => set("sku", e.target.value)} />
            </div>
            <div>
              <span className={label}>Stock on hand</span>
              <input
                type="number"
                className={`${input} mt-1.5`}
                value={draft.stock_qty}
                onChange={(e) => set("stock_qty", Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <span className={label}>Low stock alert at</span>
              <input
                type="number"
                className={`${input} mt-1.5`}
                value={draft.low_stock_threshold}
                onChange={(e) => set("low_stock_threshold", Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={label}>Fulfilment</span>
              <select
                className={`${input} mt-1.5`}
                value={draft.fulfilment_type}
                onChange={(e) => set("fulfilment_type", e.target.value as Draft["fulfilment_type"])}
              >
                <option value="ready_to_ship">Ready to ship</option>
                <option value="made_to_order">Made to order</option>
                <option value="custom">Custom commission</option>
              </select>
            </div>
            <div className="flex flex-col justify-end gap-2 pb-1">
              <Toggle label="Featured" on={draft.featured} onChange={(v) => set("featured", v)} />
              <Toggle
                label="New arrival"
                on={draft.tags.includes("new")}
                onChange={(v) => set("tags", v ? [...draft.tags, "new"] : draft.tags.filter((t) => t !== "new"))}
              />
              <Toggle label="Visible on site" on={draft.is_published} onChange={(v) => set("is_published", v)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={label}>SEO title</span>
              <input className={`${input} mt-1.5`} value={draft.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
            </div>
            <div>
              <span className={label}>SEO description</span>
              <input className={`${input} mt-1.5`} value={draft.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
            </div>
          </div>

        </div>

        {/* Imagery + sizes */}
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <SingleImage title="Card image" value={draft.main_image_url} onChange={(u) => set("main_image_url", u)} />
            <SingleImage title="Hover image" value={draft.hover_image_url} onChange={(u) => set("hover_image_url", u)} />
          </div>

          <GalleryField images={draft.images} onChange={(v) => set("images", v)} />

          <div>
            <div className="flex items-center justify-between">
              <span className={label}>Sizes, pricing and weight</span>
              <button
                onClick={() =>
                  set("sizes", [
                    ...draft.sizes,
                    { label: "New", width_cm: null, height_cm: null, price_rwf: null, weight_kg: null, sort_order: draft.sizes.length },
                  ])
                }
                className="text-xs font-semibold underline underline-offset-4"
              >
                Add size
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {draft.sizes.map((s, i) => (
                <div key={i} className="grid grid-cols-[52px_repeat(4,minmax(0,1fr))_32px] items-center gap-2">
                  <input
                    className={input}
                    value={s.label}
                    onChange={(e) => {
                      const next = [...draft.sizes];
                      next[i] = { ...s, label: e.target.value };
                      set("sizes", next);
                    }}
                  />
                  {(["width_cm", "height_cm", "price_rwf"] as const).map((field) => (
                    <input
                      key={field}
                      type="number"
                      placeholder={field === "price_rwf" ? "RWF" : field === "width_cm" ? "W cm" : "H cm"}
                      className={input}
                      value={s[field] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : null;
                        const next = [...draft.sizes];
                        const row = { ...s, [field]: value } as SizeRow;
                        if (field !== "price_rwf") row.weight_kg = autoWeight(draft.shape, row.width_cm, row.height_cm);
                        next[i] = row;
                        set("sizes", next);
                      }}
                    />
                  ))}
                  <input
                    type="number"
                    step="0.1"
                    placeholder="kg"
                    className={input}
                    value={s.weight_kg ?? ""}
                    onChange={(e) => {
                      const next = [...draft.sizes];
                      next[i] = { ...s, weight_kg: e.target.value ? Number(e.target.value) : null };
                      set("sizes", next);
                    }}
                  />
                  <button
                    aria-label="Remove size"
                    onClick={() => set("sizes", draft.sizes.filter((_, j) => j !== i))}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Weight fills in automatically from the dimensions: area in square metres multiplied by 3.8.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Toggle({ label: text, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
    >
      <span>{text}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${on ? "bg-foreground" : "bg-border"}`}>
        <span className={`block h-4 w-4 rounded-full bg-background transition-transform ${on ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function TokenField({
  title,
  hint,
  values,
  onChange,
  swatches = false,
}: {
  title: string;
  hint: string;
  values: string[];
  onChange: (v: string[]) => void;
  swatches?: boolean;
}) {
  const [entry, setEntry] = useState("");
  return (
    <div>
      <span className={label}>{title}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs">
            {swatches && <span className="h-3 w-3 rounded-full border border-border" style={{ background: v }} />}
            {v}
            <button aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        className={`${input} mt-2`}
        placeholder={hint}
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const v = entry.trim();
            if (v && !values.includes(v)) onChange([...values, v]);
            setEntry("");
          }
        }}
      />
    </div>
  );
}

function useUploader() {
  const upload = useServerFn(adminUploadImage);
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (files: FileList | File[]): Promise<string[]> => {
      setBusy(true);
      const out: string[] = [];
      try {
        for (const file of Array.from(files)) {
          const dataUrl: string = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = () => reject(new Error("read failed"));
            r.readAsDataURL(file);
          });
          const res = await upload({ data: { filename: file.name, dataUrl } });
          out.push(res.url);
        }
      } finally {
        setBusy(false);
      }
      return out;
    },
    [upload],
  );
  return { run, busy };
}

function DropZone({
  onFiles,
  busy,
  children,
  className = "",
}: {
  onFiles: (files: FileList) => void;
  busy: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [over, setOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
      onClick={() => ref.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-colors ${
        over ? "border-foreground bg-muted" : "border-border"
      } ${className}`}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
      {busy && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-background/70">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {children}
    </div>
  );
}

function SingleImage({ title, value, onChange }: { title: string; value: string | null; onChange: (v: string | null) => void }) {
  const { run, busy } = useUploader();
  const src = useMemo(() => resolveImage(value), [value]);
  return (
    <div>
      <span className={label}>{title}</span>
      <DropZone
        busy={busy}
        onFiles={async (files) => {
          const [url] = await run(files);
          if (url) onChange(url);
        }}
        className="mt-1.5 aspect-[4/5] overflow-hidden"
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full rounded-2xl object-cover" />
        ) : (
          <div className="grid h-full place-items-center gap-2 p-4 text-center text-xs text-muted-foreground">
            <Upload className="mx-auto h-5 w-5" />
            Drop an image here or click to choose
          </div>
        )}
      </DropZone>
      {value && (
        <button onClick={() => onChange(null)} className="mt-2 text-xs text-muted-foreground underline underline-offset-4">
          Remove
        </button>
      )}
    </div>
  );
}

function GalleryField({
  images,
  onChange,
}: {
  images: Array<{ url: string; alt: string | null }>;
  onChange: (v: Array<{ url: string; alt: string | null }>) => void;
}) {
  const { run, busy } = useUploader();
  return (
    <div>
      <span className={label}>Product page gallery</span>
      <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.url + i} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            <img src={resolveImage(img.url)} alt="" className="h-full w-full object-cover" />
            <button
              aria-label="Remove image"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <DropZone
          busy={busy}
          onFiles={async (files) => {
            const urls = await run(files);
            onChange([...images, ...urls.map((url) => ({ url, alt: null }))]);
          }}
          className="grid aspect-square place-items-center text-muted-foreground"
        >
          <Plus className="h-5 w-5" />
        </DropZone>
      </div>
    </div>
  );
}
