export const SUPPORT_EMAIL = "hello@rugmosiac.com";

export type FaqItem = { q: string; a: string };
export type FaqSection = { title: string; items: FaqItem[] };

const EMAIL = SUPPORT_EMAIL;

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Orders & Returns",
    items: [
      { q: "I just received my tracking number, but it's not working.", a: `Please allow 2–3 business days for tracking information to update. We often send tracking when the label is created, so it sometimes needs time to leave the studio before updating.` },
      { q: "Can I cancel or alter my order once I place it?", a: `Rugs are hand-tufted to order and enter production quickly. Email us immediately at ${EMAIL} if you would like to cancel or alter your order and we will do our best to accommodate.` },
      { q: "How do rug returns work?", a: `Email ${EMAIL} to submit a return.\n\nIn-stock rugs can be returned within 7 days of delivery with a 10% restocking fee.\n\nRugs can be exchanged with no restocking fee and we cover the cost to ship the original rug back — see "How do exchanges work?" below.\n\nAll items must be in unused condition to qualify. We do not cover the cost to package or ship your return, so keep your original packaging. Choose a shipping service with tracking; we are not responsible for items that do not reach us. Once received and authorised, we reimburse you within 7 business days.\n\nMosiac reserves the right to refuse returns that do not meet the standard above. Custom, discounted, sale, and sample rugs are not eligible for return.` },
      { q: "How do exchanges work? (Regional)", a: `Email ${EMAIL} to submit an exchange.\n\nIn-stock rugs can be exchanged within 10 days of delivery within Rwanda and neighbouring countries.\n\nAll items must be in unused condition. Email us with your order number and what you would like to exchange your original purchase for. If necessary, we will send you an invoice for any outstanding balance. Once completed, we send a return care package with shipping materials and a prepaid label; Mosiac covers those costs. Once we receive your original rug, we ship the new one to you.\n\nCustom, discounted, and sale items are not eligible for exchanges.` },
      { q: "How do exchanges work? (International)", a: `We cannot accommodate exchanges for international orders. If you are unhappy with your purchase, return the item and repurchase the right one for you. Email ${EMAIL} and we'll help throughout the process.` },
      { q: "What if my order arrives damaged or defective?", a: `Contact ${EMAIL} within 7 days of delivery. Mosiac will validate the damage or defect to qualify it for a return or exchange, with no fees on your side.\n\nTo qualify for an exchange, share your order number, date of purchase, and images of the issue. Damaged or defective items are eligible only if they have not been used. We recommend emailing us before taking any action, even beyond the 7-day window.\n\nBecause our yarn is hand-dyed in small batches, a 5–10% colour variation is normal.` },
    ],
  },
  {
    title: "Shipping",
    items: [
      { q: "When will my order ship?", a: `Every rug is hand-tufted to order in Kigali. Production takes 3–4 weeks for standard sizes, longer for custom pieces. Once your rug is finished and handed to the shipping courier, you'll receive tracking with an estimated delivery date. During major sales, allow up to one extra week for processing.` },
      { q: "Do you ship internationally?", a: `Yes — we ship worldwide via DHL. Discounted rates are calculated at checkout. Any import duties or taxes levied on your order are the responsibility of the customer.` },
    ],
  },
  {
    title: "Care",
    items: [
      { q: "How should I clean my rug?", a: `Each rug ships with specific care instructions on its product page — always check there first.\n\nNew Zealand wool is a naturally self-cleaning fibre and powers most of our tufted rugs. For regular upkeep, vacuum on a high-pile setting. Light shedding is expected for all wool rugs. Blot spills immediately with a damp cloth or paper towel — never rub. A small amount of clear soap with water can help lift a stubborn spot.\n\nIf you notice loose threads, trim them with scissors and do not pull. For deeper cleans, consult a local rug-cleaning professional.` },
      { q: "My rug arrived with creases and lumps — is this normal?", a: `Yes. Rugs are rolled for shipping, so creases and lumps are common on arrival. Shake the rug out to loosen the fibres and lay it flat. Creases smooth out over the first few days; rolling the rug in the opposite direction or laying a flat, heavy object on the folds speeds this up.` },
    ],
  },
  {
    title: "Custom & Pricing",
    items: [
      { q: "How long does a custom rug take?", a: `3–4 weeks from design approval to delivery. Complex pieces or larger sizes can take up to 6 weeks — we'll always confirm a timeline before starting.` },
      { q: "What does a custom rug cost?", a: `Every piece is quoted individually based on size, complexity, and colour count. Small rugs typically start around 750,000 RWF; larger statement pieces 1.5M+.` },
      { q: "Can you match a specific colour?", a: `Yes. We keep a wide wool library and can dye custom colours when needed. We'll send you a physical sample before we start.` },
      { q: "What if I don't like it?", a: `We share progress photos throughout production. Every design is signed off before the final piece is finished — no surprises.` },
    ],
  },
  {
    title: "General",
    items: [
      { q: "Does my rug need a rug pad?", a: `Yes. Our rugs are heavy and relatively stable on their own, but a rug pad protects your floors and keeps the rug from shifting — we strongly recommend using one.` },
      { q: "Are your products handmade?", a: `Yes. Every Mosiac rug is hand-tufted by skilled artisans in our Kigali studio.` },
      { q: "Do you offer custom rug orders?", a: `Yes — see our Custom page to start an inquiry. Any design, any size.` },
      { q: "Do you offer rug samples?", a: `Yes — reach out via the Custom page to request samples.` },
      { q: "Can I place a large order for a design project or business?", a: `Yes — email ${EMAIL} to talk about trade pricing or a bulk project.` },
    ],
  },
];
