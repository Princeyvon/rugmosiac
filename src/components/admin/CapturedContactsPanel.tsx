import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminGetCapturedContacts,
  type CapturedContact,
  type ContactsHubData,
} from "@/lib/leads-and-banner.functions";
import {
  Users,
  Search,
  Download,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Mail,
  FileText,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Filter,
} from "lucide-react";

export function CapturedContactsPanel({
  onToast,
}: {
  onToast?: (msg: string) => void;
}) {
  const [data, setData] = useState<ContactsHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<
    "all" | "popup" | "order" | "newsletter" | "bespoke" | "contact"
  >("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetCapturedContacts();
      setData(res);
    } catch (err) {
      console.error("Failed to load captured contacts:", err);
      onToast?.("Could not load captured contacts.");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const copyToClipboard = (text: string, id: string) => {
    if (!text || text === "-" || text === "N/A") return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    onToast?.(`Copied ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCsv = () => {
    if (!data || data.contacts.length === 0) {
      onToast?.("No contacts available to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Channel",
      "Origin Details",
      "Location / Context",
      "Revenue (RWF)",
      "Captured Date",
    ];

    const rows = filteredContacts.map((c) => [
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      `"${(c.phone || "").replace(/"/g, '""')}"`,
      `"${c.channel}"`,
      `"${(c.origin || "").replace(/"/g, '""')}"`,
      `"${(c.location || "").replace(/"/g, '""')}"`,
      c.spent || 0,
      `"${new Date(c.created_at).toLocaleString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `mosiac_contacts_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast?.("Exported contacts to CSV file.");
  };

  const filteredContacts = useMemo(() => {
    if (!data?.contacts) return [];
    return data.contacts.filter((c) => {
      // Channel filter
      if (channelFilter !== "all" && c.channel !== channelFilter) return false;

      // Text query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesEmail = c.email.toLowerCase().includes(q);
        const matchesPhone = c.phone.toLowerCase().includes(q);
        const matchesOrigin = c.origin.toLowerCase().includes(q);
        const matchesLocation = c.location.toLowerCase().includes(q);
        return (
          matchesName ||
          matchesEmail ||
          matchesPhone ||
          matchesOrigin ||
          matchesLocation
        );
      }
      return true;
    });
  }, [data, channelFilter, search]);

  const channelBadge = (channel: CapturedContact["channel"]) => {
    switch (channel) {
      case "popup":
        return {
          label: "Pop-up Banner",
          icon: Sparkles,
          classes: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
        };
      case "order":
        return {
          label: "Store Order",
          icon: ShoppingBag,
          classes: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
        };
      case "newsletter":
        return {
          label: "Weekly Newsletter",
          icon: Mail,
          classes: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
        };
      case "bespoke":
        return {
          label: "Bespoke Request",
          icon: FileText,
          classes: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
        };
      case "contact":
        return {
          label: "Contact Message",
          icon: MessageSquare,
          classes: "bg-stone-200 text-stone-900 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700",
        };
    }
  };

  return (
    <div className="mt-8 space-y-8">
      {/* Header & Quick Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Captured Contacts & Origins
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Centralized hub tracking every email, phone number, and visitor lead
            across pop-up banners, orders, weekly newsletters, bespoke requests,
            and messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!data || data.contacts.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total People</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {data?.stats.total ?? 0}
          </p>
          <span className="text-[11px] text-muted-foreground">across all channels</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-amber-600">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Pop-up Leads</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {data?.stats.popupLeads ?? 0}
          </p>
          <span className="text-[11px] text-muted-foreground">claimed modal code</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Store Orders</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {data?.stats.orders ?? 0}
          </p>
          <span className="text-[11px] text-muted-foreground">paying customers</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sky-600">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Newsletter</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {data?.stats.newsletter ?? 0}
          </p>
          <span className="text-[11px] text-muted-foreground">subscribers list</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-purple-600">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Bespoke Inquiries</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {data?.stats.bespoke ?? 0}
          </p>
          <span className="text-[11px] text-muted-foreground">custom rug clients</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-stone-600">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Messages</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {data?.stats.contactInquiries ?? 0}
          </p>
          <span className="text-[11px] text-muted-foreground">general inquiries</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filter:
          </span>
          {(
            [
              { key: "all", label: "All Contacts", count: data?.stats.total },
              {
                key: "popup",
                label: "Pop-up Banner",
                count: data?.stats.popupLeads,
              },
              {
                key: "order",
                label: "Store Orders",
                count: data?.stats.orders,
              },
              {
                key: "newsletter",
                label: "Weekly Newsletter",
                count: data?.stats.newsletter,
              },
              {
                key: "bespoke",
                label: "Bespoke Requests",
                count: data?.stats.bespoke,
              },
              {
                key: "contact",
                label: "Contact Messages",
                count: data?.stats.contactInquiries,
              },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setChannelFilter(t.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                channelFilter === t.key
                  ? "bg-foreground text-background font-semibold"
                  : "border border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {typeof t.count === "number" && (
                <span className="ml-1.5 opacity-70">({t.count})</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full rounded-full border border-border bg-background pl-8 pr-4 py-1.5 text-xs outline-none focus:border-foreground"
          />
        </div>
      </div>

      {/* Captured Contacts Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 uppercase tracking-wider text-[10px] text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Person / Contact</th>
                <th className="px-5 py-3">Channel & Origin</th>
                <th className="px-5 py-3">Phone / WhatsApp</th>
                <th className="px-5 py-3">Context / Location</th>
                <th className="px-5 py-3">Details / Value</th>
                <th className="px-5 py-3">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <RotateCcw className="h-4 w-4 animate-spin" /> Loading contacts…
                      </span>
                    ) : (
                      "No contacts found matching the selected filter."
                    )}
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => {
                  const badge = channelBadge(c.channel);
                  const Icon = badge.icon;
                  const cleanPhone = (c.phone || "").replace(/[^0-9]/g, "");

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">
                          {c.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                          <span className="truncate max-w-[200px]">{c.email}</span>
                          {c.email && c.email !== "-" && (
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(c.email, `${c.id}-email`)
                              }
                              title="Copy email address"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {copiedId === `${c.id}-email` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Origin & Channel */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.classes}`}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          <span>{badge.label}</span>
                        </span>
                        <div className="mt-1 text-[11px] text-muted-foreground font-mono truncate max-w-[220px]">
                          {c.origin}
                        </div>
                      </td>

                      {/* Phone / WhatsApp */}
                      <td className="px-5 py-3.5">
                        {c.phone && c.phone !== "-" && c.phone !== "N/A" ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-foreground">
                              {c.phone}
                            </span>
                            {cleanPhone.length >= 8 && (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open WhatsApp chat"
                                className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </td>

                      {/* Context / Location */}
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {c.location || "Online"}
                      </td>

                      {/* Details / Spend */}
                      <td className="px-5 py-3.5">
                        <div className="max-w-[240px] truncate text-foreground">
                          {c.details || "-"}
                        </div>
                        {c.spent > 0 && (
                          <div className="mt-0.5 text-[11px] font-semibold text-emerald-600">
                            {c.spent.toLocaleString()} RWF
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
