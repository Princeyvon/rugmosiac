import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { CurrencyDropdown } from "@/components/CurrencyDropdown";
import { resolveImage, WHATSAPP_URL, WhatsAppIcon } from "@/components/site-chrome";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart | Mosiac" },
      { name: "description", content: "Your cart at Mosiac." },
      { property: "og:title", content: "Cart | Mosiac" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, remove, setQty } = useCart();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const subtotalUsd = items.reduce((s, i) => {
    const p = i.unitPriceUsd ?? (i.unitPriceRwf ? i.unitPriceRwf / 1380 : 0);
    return s + p * i.qty;
  }, 0);

  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/catalogue" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top bar: Cart on left, X on right */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2 sm:px-10 max-w-2xl mx-auto w-full">
        <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-foreground">
          Cart
        </h1>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="p-1 text-foreground/80 hover:text-foreground transition-opacity"
        >
          <X className="h-5 w-5 stroke-[1.75]" />
        </button>
      </header>

      {items.length === 0 ? (
        /* Empty state matching user design reference */
        <div className="flex flex-1 flex-col justify-between px-6 pb-8 pt-4 max-w-2xl mx-auto w-full">
          <div className="flex flex-1 items-center justify-center min-h-[50vh]">
            <p className="text-center text-base sm:text-[17px] text-[#5e584f]">
              Your cart is empty
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/catalogue" })}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#8e8273] hover:bg-[#837666] text-base font-normal text-white transition-all shadow-sm active:scale-[0.99]"
          >
            Continue shopping
          </button>
        </div>
      ) : (
        /* Active Cart with items */
        <div className="flex flex-1 flex-col justify-between max-w-2xl mx-auto w-full px-6 pb-8 pt-2">
          <div className="flex-1 overflow-y-auto py-2">
            <ul className="divide-y divide-border/40">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 py-4">
                  {i.image && (
                    <img
                      src={resolveImage(i.image)}
                      alt={i.name}
                      className="h-20 w-20 rounded-xl object-cover bg-[#f4efe8] shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to="/catalogue/$slug"
                          params={{ slug: i.slug }}
                          className="font-display text-base font-normal hover:opacity-75"
                        >
                          {i.name}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {i.sizeLabel && <>Size {i.sizeLabel}</>}
                          {i.sizeLabel && i.color ? " · " : ""}
                          {i.color}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(i.key)}
                        aria-label="Remove item"
                        className="text-muted-foreground hover:text-foreground p-1 -mr-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQty(i.key, i.qty - 1)}
                          aria-label="Decrease quantity"
                          className="grid h-7 w-7 place-items-center rounded-full border border-border/60 hover:bg-muted text-foreground"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{i.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(i.key, i.qty + 1)}
                          aria-label="Increase quantity"
                          className="grid h-7 w-7 place-items-center rounded-full border border-border/60 hover:bg-muted text-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="font-sans text-sm font-medium">
                        {format({
                          rwf: (i.unitPriceRwf ?? 0) * i.qty,
                          usd: (i.unitPriceUsd ?? 0) * i.qty,
                        })}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-border/40 pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Subtotal</span>
              <div className="flex items-center gap-2.5">
                <CurrencyDropdown variant="compact" placement="up" />
                <span className="font-sans text-lg font-medium">
                  {format({ usd: subtotalUsd })}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Delivery calculated at checkout.
            </p>
            <Link
              to="/checkout"
              onClick={() => {
                import("@/lib/meta-client")
                  .then(({ trackMetaEvent }) => {
                    trackMetaEvent("InitiateCheckout", {
                      numItems: items.reduce((acc, i) => acc + i.qty, 0),
                      contentIds: items.map((i) => i.productId),
                    });
                  })
                  .catch(() => {});
              }}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#8e8273] hover:bg-[#837666] text-base font-normal text-white transition-all shadow-sm active:scale-[0.99]"
            >
              Proceed to checkout
            </Link>
            <button
              type="button"
              onClick={() => navigate({ to: "/catalogue" })}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1"
            >
              Continue shopping
            </button>

            <p className="text-[11px] text-center text-muted-foreground pt-1">
              Handcrafted to order in Kigali ·{" "}
              <Link to="/terms" className="underline hover:text-foreground">
                Terms &amp; Policies
              </Link>
            </p>

            <a
              href={`${WHATSAPP_URL}?text=${encodeURIComponent(
                "Hi Mosiac, I'd like to place this order:\n" +
                  items
                    .map(
                      (i) =>
                        `• ${i.name}${i.sizeLabel ? ` (${i.sizeLabel})` : ""}${i.color ? ` / ${i.color}` : ""} × ${i.qty}`,
                    )
                    .join("\n"),
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground pt-1"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" /> Or complete on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
