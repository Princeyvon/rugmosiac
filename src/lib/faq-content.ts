export const SUPPORT_EMAIL = "hello@rugmosiac.com";

export type FaqItem = { q: string; a: string };
export type FaqSection = {
  id: string;
  title: string;
  subtitle?: string;
  items: FaqItem[];
};

const EMAIL = SUPPORT_EMAIL;

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "care",
    title: "Care & Maintenance",
    subtitle: "Wool care, spot-cleaning, vacuuming, and flattening packaging creases",
    items: [
      {
        q: "How should I clean and maintain my rug?",
        a: `Each rug ships with specific care instructions on its product page, always check there first.\n\nNew Zealand wool is a naturally self-cleaning, resilient fibre that powers most of our tufted rugs. For regular upkeep, vacuum regularly on a high-pile or low-suction setting without a harsh beater bar. Light shedding is completely expected for authentic wool rugs during the first few weeks.\n\nBlot spills immediately with a clean, dry, or slightly damp cloth: never scrub or rub aggressively. A gentle lather of mild clear soap with lukewarm water will lift most stubborn spots.\n\nIf you ever notice loose tuft threads, simply snip them level with sharp scissors; never pull or tug. For comprehensive seasonal cleans, we advise using a certified wool rug professional.`,
      },
      {
        q: "My rug arrived with creases and lumps, is this normal?",
        a: `Yes, completely normal. Because rugs are rolled tightly for protective international and regional transit, temporary creases and pile lumps are expected on arrival.\n\nUnroll the rug and gently shake it out to loosen the wool fibres, then lay it flat on the floor. Most creases relax naturally within 2–5 days. To expedite the process, reverse-roll the rug loosely for 24 hours, or place flat, heavy objects (such as art books) over stubborn folds.`,
      },
      {
        q: "Is shedding normal for wool rugs?",
        a: `Yes. Premium hand-tufted New Zealand wool rugs shed excess loose surface fibres during their initial break-in period. This is an inherent characteristic of genuine spun wool and will taper off noticeably after 3–6 weeks of gentle, regular vacuuming.`,
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping & Delivery",
    subtitle: "Kigali dispatch timelines, tracking numbers, and DHL worldwide logistics",
    items: [
      {
        q: "When will my order ship?",
        a: `Every Mosiac piece is hand-tufted to order in our Kigali studio. Production takes 3–4 weeks for standard catalogue designs, and up to 5–6 weeks for elaborate custom commissions. As soon as your rug passes inspection and is transferred to the courier, you will receive an email containing real-time tracking details and an estimated delivery window.`,
      },
      {
        q: "Do you ship internationally?",
        a: `Yes, we ship worldwide via DHL Express. Discounted carrier rates and delivery windows are calculated transparently during checkout. Please note that customs duties or local import taxes imposed by destination authorities are the responsibility of the recipient.`,
      },
      {
        q: "How long does DHL transit take after dispatch?",
        a: `Once dispatched from Kigali, DHL Express typically delivers to East Africa in 1–3 business days, to Europe and the Middle East in 3–5 business days, and to the Americas and Asia-Pacific in 4–7 business days.`,
      },
    ],
  },
  {
    id: "orders",
    title: "Orders & Returns",
    subtitle: "Order alterations, exchange protocols, tracking info, and defect guarantees",
    items: [
      {
        q: "I just received my tracking number, but it's not updating yet.",
        a: `Please allow 1–2 business days for carrier tracking scans to register online. Tracking notifications are generated as soon as dispatch labels are printed, so packages sometimes need a brief window to complete departure hub scans.`,
      },
      {
        q: "Can I cancel or alter my order once placed?",
        a: `Because our rugs are hand-tufted to order, yarn selection and production frames are prepared rapidly. Email us immediately at ${EMAIL} if you need to modify dimensions, colour palettes, or delivery addresses, and we will accommodate if yarn spinning or tufting has not yet commenced.`,
      },
      {
        q: "How do rug returns work?",
        a: `Email ${EMAIL} with your order number to initiate a return.\n\nStandard in-stock rugs may be returned within 7 days of delivery in pristine, unused condition (subject to a 10% restocking inspection fee). Custom commissions, archive samples, and discounted sale rugs are made specifically for each client and cannot be returned.\n\nClients retain original transit packaging to ensure safe return transit with an insured, trackable courier. Upon verified receipt and quality sign-off, your refund is credited within 7 business days.`,
      },
      {
        q: "How do exchanges work? (Regional vs. International)",
        a: `For regional orders (Rwanda and neighbouring nations), in-stock rugs can be exchanged within 10 days of delivery with zero restocking fee; Mosiac coordinates and covers the return transit package. For international orders outside Africa, exchanges are accommodated via return and new purchase. Reach out to ${EMAIL} and our studio concierge will guide you directly.`,
      },
      {
        q: "What if my order arrives damaged or defective?",
        a: `Contact ${EMAIL} within 7 days of delivery with your order number and photographs of the defect. Mosiac will promptly review and validate the claim, replacing or repairing your rug with all return shipping covered on our side.\n\nPlease note: as all yarn is hand-dyed in boutique kettle batches and tufted by master artisans, subtle 5–10% variations in colour nuance and organic pile texture are celebrated hallmarks of authentic artisan craft.`,
      },
    ],
  },
  {
    id: "custom",
    title: "Custom & Bespoke Rugs",
    subtitle: "Timelines, custom colour matching, size quotation, and production approvals",
    items: [
      {
        q: "How long does a bespoke or custom commission take?",
        a: `Standard custom projects require 3–4 weeks from initial digital design approval to delivery. Highly intricate motifs, multi-level sculptural carving, or statement proportions (e.g., 3m × 4m+) may take up to 6 weeks. We will always furnish a confirmed delivery schedule prior to production.`,
      },
      {
        q: "What does a custom rug cost?",
        a: `Every custom rug is quoted individually based on square meterage, tuft density, yarn colour count, and pile carving complexity. Compact accent pieces typically start around 750,000 RWF, while monumental living room statement pieces range from 1,500,000 RWF upwards.`,
      },
      {
        q: "Can you match a specific paint chip, Pantone swatch, or room palette?",
        a: `Yes. Our Kigali atelier maintains an extensive archive of over 100 dyed New Zealand wool shades. When an exact match is requested, we custom-dye yarn lots and can dispatch physical yarn pom-poms or tufted strike-offs for your sign-off before full weaving begins.`,
      },
      {
        q: "How do I review progress before the rug is finished?",
        a: `We provide photographic and video studio checkpoints throughout production: first when the canvas is drafted, mid-tufting for yarn approval, and final finishing prior to latex backing and shear carving. Nothing ships without your enthusiasm.`,
      },
    ],
  },
  {
    id: "general",
    title: "General & Craftsmanship",
    subtitle: "Artisan origin, underlay rug pads, yarn samples, and commercial interior trade",
    items: [
      {
        q: "Does my rug require an underlay rug pad?",
        a: `Yes, we strongly recommend a non-slip rug pad. While Mosiac rugs feature heavy natural cotton backing with substantial weight, a quality felt or rubber pad prevents lateral slippage, protects delicate hardwood or stone floors, and adds an extra layer of acoustic insulation and underfoot luxury.`,
      },
      {
        q: "Are Mosiac rugs authentically handmade?",
        a: `Every single Mosiac rug is hand-tufted, hand-backed, and hand-carved by skilled craft artisans at our dedicated studio in Kigali, Rwanda, using 100% natural New Zealand wool.`,
      },
      {
        q: "Can I order yarn and texture samples before purchasing?",
        a: `Yes. If you would like to evaluate pile density, wool texture, and live colour in your home lighting, submit an inquiry via our Custom page to request a curated wool sample kit.`,
      },
      {
        q: "Do you offer trade discounts for interior designers and architects?",
        a: `Yes. We collaborate with interior designers, hospitality developers, and architecture firms worldwide, offering tiered trade pricing, bespoke sizing, custom dye development, and priority production queues. Contact ${EMAIL} with your studio credentials to establish a trade account.`,
      },
    ],
  },
];
