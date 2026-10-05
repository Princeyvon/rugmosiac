import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Mail,
  Clock,
  Search,
  ChevronDown,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  RotateCcw,
  Scissors,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { Nav, Footer } from "@/components/site-chrome";
import { NewsletterWeekly, RequestCallback } from "@/components/blocks";
import { FAQ_SECTIONS, SUPPORT_EMAIL as EMAIL } from "@/lib/faq-content";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | Mosiac Rugs" },
      {
        name: "description",
        content:
          "Answers to common questions about Mosiac handcrafted rugs, sizing, care, DHL shipping, returns, and custom commissions.",
      },
      { property: "og:title", content: "FAQ | Mosiac Rugs" },
      {
        property: "og:description",
        content:
          "Answers to common questions about Mosiac handcrafted rugs, sizing, care, DHL shipping, returns, and custom commissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FaqPage,
});

const SECTION_ICONS: Record<string, React.ReactNode> = {
  care: <ShieldCheck className="h-4 w-4 text-accent" />,
  shipping: <Truck className="h-4 w-4 text-accent" />,
  orders: <RotateCcw className="h-4 w-4 text-accent" />,
  custom: <Scissors className="h-4 w-4 text-accent" />,
  general: <HelpCircle className="h-4 w-4 text-accent" />,
};

function FaqPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<string>("all");
  // Default state on the accordions as collapsed on the FAQ page
  const [openSections, setOpenSections] = React.useState<string[]>([]);
  const [openQuestions, setOpenQuestions] = React.useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const toggleQuestion = (questionKey: string) => {
    setOpenQuestions((prev) =>
      prev.includes(questionKey)
        ? prev.filter((k) => k !== questionKey)
        : [...prev, questionKey],
    );
  };

  const expandAll = () => {
    setOpenSections(FAQ_SECTIONS.map((s) => s.id));
    const allQKeys: string[] = [];
    FAQ_SECTIONS.forEach((s) => {
      s.items.forEach((_, idx) => {
        allQKeys.push(`${s.id}-${idx}`);
      });
    });
    setOpenQuestions(allQKeys);
  };

  const collapseAll = () => {
    setOpenSections([]);
    setOpenQuestions([]);
  };

  // Filter sections and items based on search query
  const filteredSections = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return FAQ_SECTIONS;

    return FAQ_SECTIONS.map((sec) => {
      const matchingItems = sec.items.filter(
        (it) =>
          it.q.toLowerCase().includes(q) ||
          it.a.toLowerCase().includes(q) ||
          sec.title.toLowerCase().includes(q) ||
          (sec.subtitle && sec.subtitle.toLowerCase().includes(q)),
      );
      return {
        ...sec,
        items: matchingItems,
      };
    }).filter((sec) => sec.items.length > 0);
  }, [searchQuery]);

  // When search query is entered, auto-expand matching sections & questions
  React.useEffect(() => {
    if (searchQuery.trim()) {
      setOpenSections(filteredSections.map((s) => s.id));
      const matchKeys: string[] = [];
      filteredSections.forEach((s) => {
        s.items.forEach((_, idx) => {
          matchKeys.push(`${s.id}-${idx}`);
        });
      });
      setOpenQuestions(matchKeys);
    }
  }, [searchQuery, filteredSections]);

  const totalQuestions = FAQ_SECTIONS.reduce(
    (acc, s) => acc + s.items.length,
    0,
  );
  const totalFilteredQuestions = filteredSections.reduce(
    (acc, s) => acc + s.items.length,
    0,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="container-x mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Main 2-Column Responsive Layout: Sticky Sidebar on Left, Hierarchical Accordions on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* ========================================================= */}
          {/* LEFT SECTION: FIXED / STICKY ASIDE                       */}
          {/* Eliminates redundancy by housing "Still have questions?"  */}
          {/* in one unified, always-accessible concierge anchor.      */}
          {/* ========================================================= */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start space-y-6">
            {/* Page Header */}
            <div>
              <span className="eyebrow text-muted-foreground uppercase tracking-wider text-xs">
                Help & Concierge
              </span>
              <h1 className="mt-2 font-serif text-4xl sm:text-5xl tracking-tight text-foreground">
                FAQ
              </h1>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Everything you need to know about our hand-tufted New Zealand
                wool rugs, shipping timelines, sizing, bespoke commissions, and
                care.
              </p>
            </div>

            {/* Sticky "Still have questions?" Contact Card */}
            <div
              id="faq-contact-card"
              className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Direct Concierge</span>
              </div>
              <h2 className="mt-2.5 font-display text-xl font-medium tracking-tight text-foreground">
                Still have questions?
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Talk to a rug specialist about sizing, colours, or a custom
                commission.
              </p>

              {/* Request Callback Trigger */}
              <div className="mt-5">
                <RequestCallback className="w-full" />
              </div>

              {/* Direct Reachout Details */}
              <div className="mt-5 pt-4 border-t border-border/50 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a
                    href={`mailto:${EMAIL}`}
                    className="text-foreground hover:underline truncate"
                  >
                    {EMAIL}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Kigali Atelier: Mon–Sat, 8am–7pm CAT</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between text-xs">
                <Link
                  to="/custom"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-accent transition-colors"
                >
                  Custom inquiry →
                </Link>
                <Link
                  to="/catalogue"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse catalogue
                </Link>
              </div>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* RIGHT SECTION: MAIN ACCORDIONS REVEALING SUB-ACCORDIONS   */}
          {/* Top-level accordions for Care, Shipping, and other       */}
          {/* sections, which each expand to show sub-accordions.       */}
          {/* ========================================================= */}
          <section className="lg:col-span-8 space-y-5">
            {/* Search & Global Controls Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
              {/* Quick Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search questions (e.g. cleaning, creases, DHL, wool)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Expand / Collapse Global Toggles */}
              <div className="flex items-center gap-3 self-end sm:self-center text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={expandAll}
                  className="hover:text-foreground underline transition-colors"
                >
                  Expand all
                </button>
                <span className="text-border">•</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="hover:text-foreground underline transition-colors"
                >
                  Collapse all
                </button>
              </div>
            </div>

            {/* Quick Section Tabs Filter: Care, Shipping, Orders & Returns, Custom, General */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === "all"
                    ? "bg-foreground text-background"
                    : "border border-border/70 bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                All Sections
              </button>
              {FAQ_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(sec.id);
                    if (!openSections.includes(sec.id)) {
                      setOpenSections((prev) => [...prev, sec.id]);
                    }
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === sec.id
                      ? "bg-foreground text-background"
                      : "border border-border/70 bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{sec.title}</span>
                </button>
              ))}
            </div>

            {/* If search returns 0 results */}
            {filteredSections.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="text-sm font-medium text-foreground">
                  No questions match &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try searching for keywords like &ldquo;cleaning&rdquo;,
                  &ldquo;transit&rdquo;, &ldquo;samples&rdquo;, or contact our
                  concierge.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Reset search
                </button>
              </div>
            )}

            {/* LIST OF PRIMARY SECTION ACCORDIONS (Care, Shipping, Orders, Custom, General) */}
            <div className="space-y-4">
              {filteredSections
                .filter((s) => activeTab === "all" || s.id === activeTab)
                .map((section) => {
                const isSectionOpen = openSections.includes(section.id);
                const icon = SECTION_ICONS[section.id] || (
                  <HelpCircle className="h-4 w-4" />
                );

                return (
                  <div
                    key={section.id}
                    id={`section-accordion-${section.id}`}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isSectionOpen
                        ? "border-foreground/20 bg-card shadow-sm"
                        : "border-border/70 bg-card/60 hover:border-border hover:bg-card"
                    }`}
                  >
                    {/* PRIMARY SECTION ACCORDION TRIGGER */}
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={isSectionOpen}
                      className="w-full flex items-center justify-between p-5 sm:p-6 text-left transition-colors cursor-pointer group select-none"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 pr-4">
                        <div
                          className={`mt-0.5 sm:mt-0 grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
                            isSectionOpen
                              ? "bg-foreground text-background"
                              : "bg-muted text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {icon}
                        </div>
                        <div>
                          <h2 className="font-display text-lg sm:text-xl font-medium text-foreground tracking-tight">
                            {section.title}
                          </h2>
                          {section.subtitle && (
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                              {section.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        <div
                          className={`grid h-7 w-7 place-items-center rounded-full border border-border/80 text-muted-foreground transition-transform duration-200 ${
                            isSectionOpen
                              ? "rotate-180 bg-foreground text-background border-foreground"
                              : "group-hover:border-foreground group-hover:text-foreground"
                          }`}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </button>

                    {/* REVEALED CONTENT: NESTED SUB-ACCORDIONS FOR EACH QUESTION */}
                    {isSectionOpen && (
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-border/40 animate-in fade-in-50 duration-200">
                        <div className="divide-y divide-border/40">
                          {section.items.map((item, idx) => {
                            const questionKey = `${section.id}-${idx}`;
                            const isQuestionOpen =
                              openQuestions.includes(questionKey);

                            return (
                              <div key={idx} className="py-3.5 first:pt-2 last:pb-1">
                                {/* SUB-ACCORDION TRIGGER */}
                                <button
                                  type="button"
                                  onClick={() => toggleQuestion(questionKey)}
                                  aria-expanded={isQuestionOpen}
                                  className="w-full flex items-start justify-between gap-3 text-left py-1 group cursor-pointer"
                                >
                                  <span
                                    className={`text-sm sm:text-base font-medium leading-snug transition-colors ${
                                      isQuestionOpen
                                        ? "text-foreground font-semibold"
                                        : "text-foreground/90 group-hover:text-foreground"
                                    }`}
                                  >
                                    {item.q}
                                  </span>
                                  <span className="mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground">
                                    {isQuestionOpen ? (
                                      <Minus className="h-4 w-4" />
                                    ) : (
                                      <Plus className="h-4 w-4" />
                                    )}
                                  </span>
                                </button>

                                {/* SUB-ACCORDION CONTENT (ANSWER) */}
                                {isQuestionOpen && (
                                  <div className="mt-2.5 pr-6 text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-pre-line animate-in fade-in-50 duration-150 pl-0.5">
                                    {item.a}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Support Footer note */}
            <div className="pt-6 border-t border-border/50 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
              <p>
                Covering care, shipping, materials, and bespoke commissions across our atelier.
              </p>
              <p>
                Need something else? Email{" "}
                <a
                  href={`mailto:${EMAIL}`}
                  className="text-foreground underline underline-offset-4 hover:text-accent"
                >
                  {EMAIL}
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      <NewsletterWeekly />
      <Footer />
    </div>
  );
}

