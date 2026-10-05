import { useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListAllReviews,
  adminModerateReview,
  adminDeleteReview,
} from "@/lib/tracking-and-reviews.functions";
import type { VerifiedReview } from "@/lib/tracking-and-reviews.types";
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  MessageSquareQuote,
  Sparkles,
  Copy,
  ExternalLink,
  MessageCircle,
  Filter,
  Send,
  Link as LinkIcon,
} from "lucide-react";

export function ReviewsPanel({ onToast }: { onToast: (m: string) => void }) {
  const listFn = useServerFn(adminListAllReviews);
  const moderateFn = useServerFn(adminModerateReview);
  const deleteFn = useServerFn(adminDeleteReview);

  const [reviews, setReviews] = useState<VerifiedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);

  // Invite link generator state
  const [inviteOrder, setInviteOrder] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFn();
      setReviews(res);
      // Pre-fill existing replies
      const initReplies: Record<string, string> = {};
      for (const r of res) {
        if (r.admin_reply) initReplies[r.id] = r.admin_reply;
      }
      setReplies(initReplies);
    } catch {
      onToast("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }, [listFn, onToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleModerate = async (
    id: string,
    status: "approved" | "pending" | "rejected",
  ) => {
    try {
      await moderateFn({ data: { id, status } });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
      onToast(`Review marked as ${status}.`);
    } catch {
      onToast("Failed to update review status.");
    }
  };

  const handleSaveReply = async (id: string) => {
    const text = replies[id] ?? "";
    setSavingReplyId(id);
    try {
      const active = reviews.find((r) => r.id === id);
      await moderateFn({
        data: {
          id,
          status: active?.status || "approved",
          adminReply: text.trim() || null,
        },
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, admin_reply: text.trim() || null } : r)),
      );
      onToast("Atelier studio response saved.");
    } catch {
      onToast("Failed to save response.");
    } finally {
      setSavingReplyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      await deleteFn({ data: { id } });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      onToast("Review removed.");
    } catch {
      onToast("Failed to delete review.");
    }
  };

  const generateInviteLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteOrder.trim() || !inviteEmail.trim()) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/track-order?order=${encodeURIComponent(
      inviteOrder.trim(),
    )}&email=${encodeURIComponent(inviteEmail.trim())}&review=true`;
    setGeneratedLink(url);
    if (typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(url);
    }
    onToast("Review invite link generated & copied to clipboard!");
  };

  const visible = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const avgRating =
    approvedCount > 0
      ? Math.round(
          (reviews
            .filter((r) => r.status === "approved")
            .reduce((s, r) => s + r.rating, 0) /
            approvedCount) *
            10,
        ) / 10
      : 5.0;

  return (
    <section className="mt-8 space-y-8">
      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-background p-5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Total Reviews</span>
          <p className="mt-2 text-3xl font-display font-medium text-foreground">{reviews.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Approved &amp; Live</span>
          <p className="mt-2 text-3xl font-display font-medium text-emerald-600">{approvedCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Pending Moderation</span>
          <p className="mt-2 text-3xl font-display font-medium text-amber-500">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Average Rating</span>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-display font-medium text-foreground">{avgRating}</p>
            <div className="flex items-center text-amber-500">
              <Star className="h-4 w-4 fill-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Review Invitation Link Generator for Buyers */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Generate Buyer Review Access Link
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Generate a direct, private review link to email or WhatsApp to a client after their rug has been delivered. The link bypasses the lookup form and opens the review submission dialog for their order.
        </p>

        <form onSubmit={generateInviteLink} className="flex flex-wrap items-end gap-3 pt-1">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
              Order Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MSC-8921"
              value={inviteOrder}
              onChange={(e) => setInviteOrder(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
              Buyer Email
            </label>
            <input
              type="email"
              required
              placeholder="e.g. buyer@domain.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            className="rounded-full bg-foreground text-background px-5 py-2 text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Generate &amp; Copy Link
          </button>
        </form>

        {generatedLink && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-muted/60 border border-border p-3 text-xs">
            <code className="truncate text-muted-foreground font-mono text-[11px]">
              {generatedLink}
            </code>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  onToast("Link copied!");
                }}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
              <a
                href={generatedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground text-xs">
          Loading verified reviews…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No reviews found for the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-sm text-foreground">
                      {r.customer_name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified Buyer</span>
                    </span>
                    <span className="rounded-md border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                      Order #{r.order_number}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {r.customer_email} · {r.customer_location} · Piece:{" "}
                    <strong className="text-foreground">{r.product_name}</strong> ({r.product_slug})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= r.rating ? "fill-amber-500" : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      r.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : r.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">{r.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>
              </div>

              {/* Atelier Response Box */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Atelier Studio Response (Displays publicly on product page)
                  </span>
                  {r.admin_reply && (
                    <span className="text-[10px] text-emerald-600 font-semibold">Active Reply</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Thank you Aline, we loved hand-tufting this piece for your home!"
                    value={replies[r.id] ?? ""}
                    onChange={(e) => setReplies({ ...replies, [r.id]: e.target.value })}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-hidden focus:border-foreground"
                  />
                  <button
                    type="button"
                    disabled={savingReplyId === r.id}
                    onClick={() => handleSaveReply(r.id)}
                    className="rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {savingReplyId === r.id ? "Saving…" : "Save Reply"}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs">
                <span className="text-muted-foreground text-[11px]">
                  Submitted {new Date(r.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {r.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => handleModerate(r.id, "approved")}
                      className="rounded-lg border border-emerald-600/30 bg-emerald-500/10 text-emerald-600 px-3 py-1 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => handleModerate(r.id, "rejected")}
                      className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-3 py-1 hover:bg-destructive/20 text-xs font-medium flex items-center gap-1"
                    >
                      <XCircle className="h-3 w-3" /> Reject
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
