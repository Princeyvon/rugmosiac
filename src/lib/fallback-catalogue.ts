// Fallback catalog dataset used when Supabase tables are not yet initialized
import type { Product, ExploreShot } from "./catalogue.functions";
import { HASSAN_OUTLINE_SVG } from "./size-guide-outlines";

export const fallbackCategories = [
  {
    "id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
    "slug": "area-rugs",
    "name": "Area Rugs",
    "description": "Statement floor pieces, hand-tufted to order.",
    "image_url": null,
    "sort_order": 1,
    "created_at": "2026-08-04T00:04:30.797601+00:00"
  },
  {
    "id": "13fc3743-15b2-4941-be4d-be1c8601b254",
    "slug": "wall-art",
    "name": "Wall Art Pieces",
    "description": "Tufted textile art made to hang.",
    "image_url": null,
    "sort_order": 2,
    "created_at": "2026-08-04T00:04:30.797601+00:00"
  },
  {
    "id": "0118bf5a-bea5-4f85-b083-aa6c54de2822",
    "slug": "custom",
    "name": "Custom Rugs",
    "description": "Any design, any size, made for you.",
    "image_url": null,
    "sort_order": 3,
    "created_at": "2026-08-04T00:04:30.797601+00:00"
  }
];

export const fallbackProducts: Product[] = [
  {
    "id": "b69324c2-faa8-4478-9ddd-3a7c694e11a3",
    "slug": "arc",
    "name": "Arc",
    "category_id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
    "short_description": "Cream and white ground with golden arcs and dark brown figure.",
    "description": "Arc is a study in balance: a soft cream field framed in brown, with a golden arc sweeping through a dark, grounded figure. Hand-tufted in New Zealand wool.",
    "shape": "rectangle",
    "material": "Hand-tufted New Zealand wool",
    "production_time": "Ready in 3 to 4 weeks",
    "base_price_rwf": 320000,
    "base_price_usd": 219.18,
    "stock_status": "made_to_order",
    "featured": true,
    "featured_order": 1,
    "main_image_url": "/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg",
    "color_palette": [
      "#F0E2C4",
      "#C08A21",
      "#1A1310"
    ],
    "tags": [
      "rectangle",
      "neutral",
      "abstract"
    ],
    "is_published": true,
    "created_at": "2026-08-04T00:04:30.797601+00:00",
    "updated_at": "2026-09-02T12:53:41.359243+00:00",
    "hover_image_url": "/__l5e/assets-v1/6cc92776-f0f6-44cd-b37e-d7d6e3022b7a/arc-2.jpg",
    "colorways": [
      {
        "name": "Original",
        "colors": "Cream / White with golden, brown frames, dark brown figure"
      }
    ],
    "notes": null,
    "sku": "MSC-ARC",
    "cost_rwf": null,
    "seo_title": null,
    "seo_description": null,
    "design_style": null,
    "care_instructions": null,
    "weight_kg": null,
    "archived_at": null,
    "stock_qty": 0,
    "reserved_qty": 0,
    "low_stock_threshold": 2,
    "fulfilment_type": "made_to_order",
    "category": {
      "id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
      "name": "Area Rugs",
      "slug": "area-rugs",
      "image_url": null,
      "created_at": "2026-08-04T00:04:30.797601+00:00",
      "sort_order": 1,
      "description": "Statement floor pieces, hand-tufted to order."
    },
    "sizes": [
      {
        "id": "f92591f6-47cb-44df-9726-07f5fbe2386b",
        "label": "L",
        "width_cm": 200,
        "height_cm": 300,
        "price_rwf": 870000,
        "price_usd": 595.89,
        "weight_kg": 22.8,
        "product_id": "b69324c2-faa8-4478-9ddd-3a7c694e11a3",
        "sort_order": 3
      },
      {
        "id": "c8a366c7-13f5-412a-b408-7fda5cfc8613",
        "label": "M",
        "width_cm": 150,
        "height_cm": 220,
        "price_rwf": 480000,
        "price_usd": 328.77,
        "weight_kg": 12.5,
        "product_id": "b69324c2-faa8-4478-9ddd-3a7c694e11a3",
        "sort_order": 2
      },
      {
        "id": "c572ebe5-2f76-4c16-b519-e8b166e0f62e",
        "label": "S",
        "width_cm": 120,
        "height_cm": 180,
        "price_rwf": 320000,
        "price_usd": 219.18,
        "weight_kg": 8.2,
        "product_id": "b69324c2-faa8-4478-9ddd-3a7c694e11a3",
        "sort_order": 1
      }
    ],
    "images": [
      {
        "id": "591fb614-2965-4582-aaa9-e7d53ee5d712",
        "alt": "Arc hand-tufted rug",
        "url": "/__l5e/assets-v1/3adfeab6-35aa-4124-b516-2d33c86ef3e0/arc-1.jpg",
        "product_id": "b69324c2-faa8-4478-9ddd-3a7c694e11a3",
        "sort_order": 0,
        "colorway_id": null
      },
      {
        "id": "da5ec170-2fcb-4dec-8aff-ecbefb6eed03",
        "alt": "Arc hand-tufted rug",
        "url": "/__l5e/assets-v1/6cc92776-f0f6-44cd-b37e-d7d6e3022b7a/arc-2.jpg",
        "product_id": "b69324c2-faa8-4478-9ddd-3a7c694e11a3",
        "sort_order": 1,
        "colorway_id": null
      }
    ]
  },
  {
    "id": "8647bde4-28e4-4aa7-9b24-3569aa829d61",
    "slug": "burg",
    "name": "Burg",
    "category_id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
    "short_description": "Deep burgundy field lifted with blush pink.",
    "description": "Burg pairs a saturated deep red ground with soft blush detailing. Rich, warm, and quietly dramatic underfoot.",
    "shape": "rectangle",
    "material": "Hand-tufted New Zealand wool",
    "production_time": "Ready in 3 to 4 weeks",
    "base_price_rwf": 320000,
    "base_price_usd": 219.18,
    "stock_status": "made_to_order",
    "featured": true,
    "featured_order": 2,
    "main_image_url": "/__l5e/assets-v1/f65fc452-6a55-416b-94bc-1e5108b44c6d/burg-1.jpg",
    "color_palette": [
      "#6B1F2A",
      "#E8B4B8"
    ],
    "tags": [
      "rectangle",
      "red",
      "bold"
    ],
    "is_published": true,
    "created_at": "2026-08-04T00:04:30.797601+00:00",
    "updated_at": "2026-09-02T12:53:41.359243+00:00",
    "hover_image_url": "/__l5e/assets-v1/716c4390-0c0c-42fc-853e-b4f9d970d33e/burg-2.jpg",
    "colorways": [
      {
        "name": "Original",
        "colors": "Deep Red / Burgundy with blush pink"
      },
      {
        "name": "Variant 2",
        "colors": "Deep blue with cream blue"
      }
    ],
    "notes": null,
    "sku": "MSC-BURG",
    "cost_rwf": null,
    "seo_title": null,
    "seo_description": null,
    "design_style": null,
    "care_instructions": null,
    "weight_kg": null,
    "archived_at": null,
    "stock_qty": 0,
    "reserved_qty": 0,
    "low_stock_threshold": 2,
    "fulfilment_type": "made_to_order",
    "category": {
      "id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
      "name": "Area Rugs",
      "slug": "area-rugs",
      "image_url": null,
      "created_at": "2026-08-04T00:04:30.797601+00:00",
      "sort_order": 1,
      "description": "Statement floor pieces, hand-tufted to order."
    },
    "sizes": [
      {
        "id": "3628e431-814f-4230-89df-ebb92fd6525b",
        "label": "L",
        "width_cm": 200,
        "height_cm": 300,
        "price_rwf": 870000,
        "price_usd": 595.89,
        "weight_kg": 22.8,
        "product_id": "8647bde4-28e4-4aa7-9b24-3569aa829d61",
        "sort_order": 3
      },
      {
        "id": "8bda7b56-b3b4-4cd7-b8ca-4e75b88c66ec",
        "label": "M",
        "width_cm": 150,
        "height_cm": 220,
        "price_rwf": 480000,
        "price_usd": 328.77,
        "weight_kg": 12.5,
        "product_id": "8647bde4-28e4-4aa7-9b24-3569aa829d61",
        "sort_order": 2
      },
      {
        "id": "6dd62404-a9a1-4756-9758-d635aa591062",
        "label": "S",
        "width_cm": 120,
        "height_cm": 180,
        "price_rwf": 320000,
        "price_usd": 219.18,
        "weight_kg": 8.2,
        "product_id": "8647bde4-28e4-4aa7-9b24-3569aa829d61",
        "sort_order": 1
      }
    ],
    "images": [
      {
        "id": "8ac3b66c-8e9d-42e8-b2a7-cc6246c7d90a",
        "alt": "Burg rug overhead",
        "url": "/__l5e/assets-v1/f65fc452-6a55-416b-94bc-1e5108b44c6d/burg-1.jpg",
        "product_id": "8647bde4-28e4-4aa7-9b24-3569aa829d61",
        "sort_order": 0,
        "colorway_id": "Original"
      },
      {
        "id": "43f7c179-8061-4f57-8d89-334b82e2b9db",
        "alt": "Burg rug in a bedroom",
        "url": "/__l5e/assets-v1/716c4390-0c0c-42fc-853e-b4f9d970d33e/burg-2.jpg",
        "product_id": "8647bde4-28e4-4aa7-9b24-3569aa829d61",
        "sort_order": 1,
        "colorway_id": "Variant 2"
      }
    ]
  },
  {
    "id": "5b62c5c1-f4d1-4f70-8145-0eecf63589f6",
    "slug": "tai",
    "name": "Tai",
    "category_id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
    "short_description": "Ocean blues and teal breaking into white surf.",
    "description": "Tai is water rendered in wool. Medium blue and blue teal roll across the field, cut with black line work, dark blue grey shadow and drifts of light grey and cream.",
    "shape": "rectangle",
    "material": "Hand-tufted New Zealand wool",
    "production_time": "Ready in 3 to 4 weeks",
    "base_price_rwf": 320000,
    "base_price_usd": 219.18,
    "stock_status": "made_to_order",
    "featured": true,
    "featured_order": 7,
    "main_image_url": "/__l5e/assets-v1/c46c2792-6b2e-4db6-b56c-8ad9251966b5/tai-1.jpg",
    "color_palette": [
      "#2B7FC4",
      "#1FA8B8",
      "#111111",
      "#D8DEE4"
    ],
    "tags": [
      "rectangle",
      "blue",
      "abstract",
      "bestseller"
    ],
    "is_published": true,
    "created_at": "2026-08-04T00:04:30.797601+00:00",
    "updated_at": "2026-09-02T12:53:41.359243+00:00",
    "hover_image_url": "/__l5e/assets-v1/c6566d8a-98b5-4500-b6d6-56378cbfab51/tai-2.jpg",
    "colorways": [
      {
        "name": "Original",
        "colors": "Medium blue and blue teal with black, dark blue grey and light grey"
      },
      {
        "name": "Variant 2",
        "colors": "Pink, cream, red and grey"
      }
    ],
    "notes": null,
    "sku": "MSC-TAI",
    "cost_rwf": null,
    "seo_title": null,
    "seo_description": null,
    "design_style": null,
    "care_instructions": null,
    "weight_kg": null,
    "archived_at": null,
    "stock_qty": 0,
    "reserved_qty": 0,
    "low_stock_threshold": 2,
    "fulfilment_type": "made_to_order",
    "category": {
      "id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
      "name": "Area Rugs",
      "slug": "area-rugs",
      "image_url": null,
      "created_at": "2026-08-04T00:04:30.797601+00:00",
      "sort_order": 1,
      "description": "Statement floor pieces, hand-tufted to order."
    },
    "sizes": [
      {
        "id": "751dba6f-989c-4083-b8cd-c5b09e297e89",
        "label": "L",
        "width_cm": 200,
        "height_cm": 300,
        "price_rwf": 870000,
        "price_usd": 595.89,
        "weight_kg": 22.8,
        "product_id": "5b62c5c1-f4d1-4f70-8145-0eecf63589f6",
        "sort_order": 3
      },
      {
        "id": "11a81a77-5c21-492e-ab1a-ff84f1e1372b",
        "label": "M",
        "width_cm": 150,
        "height_cm": 220,
        "price_rwf": 480000,
        "price_usd": 328.77,
        "weight_kg": 12.5,
        "product_id": "5b62c5c1-f4d1-4f70-8145-0eecf63589f6",
        "sort_order": 2
      },
      {
        "id": "e8cbad60-605b-4524-99fb-d9052d858641",
        "label": "S",
        "width_cm": 120,
        "height_cm": 180,
        "price_rwf": 320000,
        "price_usd": 219.18,
        "weight_kg": 8.2,
        "product_id": "5b62c5c1-f4d1-4f70-8145-0eecf63589f6",
        "sort_order": 1
      }
    ],
    "images": [
      {
        "id": "b6c9990a-db37-4250-b118-fe56529582b1",
        "alt": "Tai rug beside a bed in a bright bedroom",
        "url": "/__l5e/assets-v1/c46c2792-6b2e-4db6-b56c-8ad9251966b5/tai-1.jpg",
        "product_id": "5b62c5c1-f4d1-4f70-8145-0eecf63589f6",
        "sort_order": 1,
        "colorway_id": "Original"
      },
      {
        "id": "1c4a0f20-d59f-4dcf-a1f2-f844cca54219",
        "alt": "Tai rug at floor level showing the blue field",
        "url": "/__l5e/assets-v1/c6566d8a-98b5-4500-b6d6-56378cbfab51/tai-2.jpg",
        "product_id": "5b62c5c1-f4d1-4f70-8145-0eecf63589f6",
        "sort_order": 2,
        "colorway_id": "Original"
      },
      {
        "id": "8fe3b6a6-b26e-4f39-94b8-32b1d8de5846",
        "alt": "Close up of the Tai pile and black line work",
        "url": "/__l5e/assets-v1/0f4ca491-3973-42a4-bf1f-6af97f4ce657/tai-3.jpg",
        "product_id": "5b62c5c1-f4d1-4f70-8145-0eecf63589f6",
        "sort_order": 3,
        "colorway_id": "Original"
      },
      {
        "id": "f18284f7-18a6-47fe-85fb-661e2f2ec505",
        "alt": "Edge detail of the Tai rug",
        "url": "/__l5e/assets-v1/a042914d-aeb4-4f95-a01a-92704cbc1fe5/tai-4.jpg",
        "product_id": "5b62c5c1-f4d1-4f70-8145-0eecf63589f6",
        "sort_order": 4,
        "colorway_id": "Variant 2"
      },
      {
        "id": "c5219312-3e50-410b-8c95-0a6b8688423d",
        "alt": "Tai rug in use in a bedroom",
        "url": "/__l5e/assets-v1/dc2e9888-8b03-4f7a-b298-39ece2ed9364/tai-5.jpg",
        "product_id": "5b62c5c1-f4d1-4f70-8145-0eecf63589f6",
        "sort_order": 5,
        "colorway_id": "Variant 2"
      }
    ]
  },
  {
    "id": "67cc07bc-32a3-4611-996a-aed2efdd49b4",
    "slug": "celestial-night",
    "name": "Celestial Night",
    "category_id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
    "short_description": "Deep navy sky with cream and golden yellow points of light.",
    "description": "Celestial Night maps a night sky in wool: a deep navy ground scattered with cream and golden yellow. A calm, cosmic anchor for a room.",
    "shape": "rectangle",
    "material": "Hand-tufted New Zealand wool",
    "production_time": "Ready in 3 to 4 weeks",
    "base_price_rwf": 320000,
    "base_price_usd": 219.18,
    "stock_status": "made_to_order",
    "featured": true,
    "featured_order": 3,
    "main_image_url": "/__l5e/assets-v1/aabe64b3-5f6f-4c3c-92e2-3b41f272d2cc/celestial-1.jpg",
    "color_palette": [
      "#111C3A",
      "#F4EFE7",
      "#E5B93C"
    ],
    "tags": [
      "rectangle",
      "blue",
      "abstract"
    ],
    "is_published": true,
    "created_at": "2026-08-04T00:04:30.797601+00:00",
    "updated_at": "2026-09-02T12:53:41.359243+00:00",
    "hover_image_url": null,
    "colorways": [
      {
        "name": "Original",
        "colors": "Deep navy blue with cream and golden yellow"
      }
    ],
    "notes": null,
    "sku": "MSC-CELEST",
    "cost_rwf": null,
    "seo_title": null,
    "seo_description": null,
    "design_style": null,
    "care_instructions": null,
    "weight_kg": null,
    "archived_at": null,
    "stock_qty": 0,
    "reserved_qty": 0,
    "low_stock_threshold": 2,
    "fulfilment_type": "made_to_order",
    "category": {
      "id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
      "name": "Area Rugs",
      "slug": "area-rugs",
      "image_url": null,
      "created_at": "2026-08-04T00:04:30.797601+00:00",
      "sort_order": 1,
      "description": "Statement floor pieces, hand-tufted to order."
    },
    "sizes": [
      {
        "id": "3b017a6f-c700-4e66-86b5-77233f0e559a",
        "label": "L",
        "width_cm": 200,
        "height_cm": 300,
        "price_rwf": 870000,
        "price_usd": 595.89,
        "weight_kg": 22.8,
        "product_id": "67cc07bc-32a3-4611-996a-aed2efdd49b4",
        "sort_order": 3
      },
      {
        "id": "15478186-563a-4f2b-b0d6-414dc39f09b5",
        "label": "M",
        "width_cm": 150,
        "height_cm": 220,
        "price_rwf": 480000,
        "price_usd": 328.77,
        "weight_kg": 12.5,
        "product_id": "67cc07bc-32a3-4611-996a-aed2efdd49b4",
        "sort_order": 2
      },
      {
        "id": "3eb8b613-89a4-4f52-9154-ce04aeb77bcb",
        "label": "S",
        "width_cm": 120,
        "height_cm": 180,
        "price_rwf": 320000,
        "price_usd": 219.18,
        "weight_kg": 8.2,
        "product_id": "67cc07bc-32a3-4611-996a-aed2efdd49b4",
        "sort_order": 1
      }
    ],
    "images": [
      {
        "id": "fd2dd75a-4332-49b8-9ba1-cdfeb10c6198",
        "alt": "Celestial Night rug",
        "url": "/__l5e/assets-v1/aabe64b3-5f6f-4c3c-92e2-3b41f272d2cc/celestial-1.jpg",
        "product_id": "67cc07bc-32a3-4611-996a-aed2efdd49b4",
        "sort_order": 0,
        "colorway_id": null
      }
    ]
  },
  {
    "id": "b541208d-5524-4575-b812-fb960b93921a",
    "slug": "melt",
    "name": "Melt",
    "category_id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
    "short_description": "Rich brown stripes dissolving into a liquid, hand cut edge.",
    "description": "Melt starts as clean diagonal stripes in tan and rich brown, then loses its nerve: the pattern pools and runs into an irregular hand carved edge. Shown at 150 by 100 cm.",
    "shape": "rectangle",
    "material": "Hand-tufted New Zealand wool",
    "production_time": "Ready in 3 to 4 weeks",
    "base_price_rwf": 320000,
    "base_price_usd": 219.18,
    "stock_status": "made_to_order",
    "featured": true,
    "featured_order": 6,
    "main_image_url": "/__l5e/assets-v1/6c661115-c673-45ed-a9e4-86925b566cd0/melt-1.jpg",
    "color_palette": [
      "#F2DCC0",
      "#8A5A2B",
      "#5C3A1A"
    ],
    "tags": [
      "rectangle",
      "brown",
      "organic",
      "bestseller"
    ],
    "is_published": true,
    "created_at": "2026-08-04T00:04:30.797601+00:00",
    "updated_at": "2026-09-02T12:53:41.359243+00:00",
    "hover_image_url": "/__l5e/assets-v1/375074e7-0c05-44e3-b171-0008b1821312/melt-2.jpg",
    "colorways": [
      {
        "name": "Original",
        "colors": "Tan / beige brown with rich brown"
      }
    ],
    "notes": null,
    "sku": "MSC-MELT",
    "cost_rwf": null,
    "seo_title": null,
    "seo_description": null,
    "design_style": null,
    "care_instructions": null,
    "weight_kg": null,
    "archived_at": null,
    "stock_qty": 0,
    "reserved_qty": 0,
    "low_stock_threshold": 2,
    "fulfilment_type": "made_to_order",
    "category": {
      "id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
      "name": "Area Rugs",
      "slug": "area-rugs",
      "image_url": null,
      "created_at": "2026-08-04T00:04:30.797601+00:00",
      "sort_order": 1,
      "description": "Statement floor pieces, hand-tufted to order."
    },
    "sizes": [
      {
        "id": "88308df1-a004-47f4-b563-dcadfbbed283",
        "label": "L",
        "width_cm": 200,
        "height_cm": 300,
        "price_rwf": 870000,
        "price_usd": 595.89,
        "weight_kg": 22.8,
        "product_id": "b541208d-5524-4575-b812-fb960b93921a",
        "sort_order": 3
      },
      {
        "id": "cfa692da-6a7f-42d3-9c65-a037bf685219",
        "label": "M",
        "width_cm": 150,
        "height_cm": 220,
        "price_rwf": 480000,
        "price_usd": 328.77,
        "weight_kg": 12.5,
        "product_id": "b541208d-5524-4575-b812-fb960b93921a",
        "sort_order": 2
      },
      {
        "id": "b9321511-6109-4fd0-a826-a216ad06a1d7",
        "label": "S",
        "width_cm": 120,
        "height_cm": 180,
        "price_rwf": 320000,
        "price_usd": 219.18,
        "weight_kg": 8.2,
        "product_id": "b541208d-5524-4575-b812-fb960b93921a",
        "sort_order": 1
      }
    ],
    "images": [
      {
        "id": "aa84082a-97a2-44a1-9a3d-f6f94ccde055",
        "alt": "Melt rug photographed from above",
        "url": "/__l5e/assets-v1/6c661115-c673-45ed-a9e4-86925b566cd0/melt-1.jpg",
        "product_id": "b541208d-5524-4575-b812-fb960b93921a",
        "sort_order": 1,
        "colorway_id": null
      },
      {
        "id": "3e7f2221-9d62-42e0-a655-ecf97f41f50f",
        "alt": "Melt rug beside a bed",
        "url": "/__l5e/assets-v1/375074e7-0c05-44e3-b171-0008b1821312/melt-2.jpg",
        "product_id": "b541208d-5524-4575-b812-fb960b93921a",
        "sort_order": 2,
        "colorway_id": null
      },
      {
        "id": "329cf102-200d-4756-bd9e-15437b22108a",
        "alt": "Close up of the Melt stripe pattern",
        "url": "/__l5e/assets-v1/d15ee859-c492-47e3-b2eb-00c46ad61ac4/melt-3.jpg",
        "product_id": "b541208d-5524-4575-b812-fb960b93921a",
        "sort_order": 3,
        "colorway_id": null
      },
      {
        "id": "ac476ff0-af61-4a44-92f0-27e37d28279f",
        "alt": "Hand carved edge detail on the Melt rug",
        "url": "/__l5e/assets-v1/bc05b933-8fc4-4519-b3ec-88b56043e381/melt-4.jpg",
        "product_id": "b541208d-5524-4575-b812-fb960b93921a",
        "sort_order": 4,
        "colorway_id": null
      }
    ]
  },
  {
    "id": "21d42e32-070d-4640-8751-b85680f5ecdc",
    "slug": "hassan",
    "name": "Hassan",
    "category_id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
    "short_description": "Black, cream and golden tan in strong graphic blocks.",
    "description": "Hassan is high contrast and architectural: black against cream, warmed with golden tan. It works hardest in a minimal room.",
    "shape": "rectangle",
    "size_guide_svg": HASSAN_OUTLINE_SVG,
    "material": "Hand-tufted New Zealand wool",
    "production_time": "Ready in 3 to 4 weeks",
    "base_price_rwf": 320000,
    "base_price_usd": 219.18,
    "stock_status": "made_to_order",
    "featured": true,
    "featured_order": 5,
    "main_image_url": "/__l5e/assets-v1/10176d14-3299-443a-9708-a27203c5d214/hassan-1.jpg",
    "color_palette": [
      "#E2A857",
      "#F2EDE4",
      "#111111"
    ],
    "tags": [
      "rectangle",
      "monochrome",
      "graphic"
    ],
    "is_published": true,
    "created_at": "2026-08-04T00:04:30.797601+00:00",
    "updated_at": "2026-09-02T12:53:41.359243+00:00",
    "hover_image_url": "/__l5e/assets-v1/12431968-acc8-4c32-a82e-2a0918a92e0b/hassan-2.jpg",
    "colorways": [
      {
        "name": "Original",
        "colors": "Black, cream and golden tan"
      },
      {
        "name": "Variant 2",
        "colors": "Rust orange red with black and grey"
      }
    ],
    "notes": null,
    "sku": "MSC-HASSAN",
    "cost_rwf": null,
    "seo_title": null,
    "seo_description": null,
    "design_style": null,
    "care_instructions": null,
    "weight_kg": null,
    "archived_at": null,
    "stock_qty": 0,
    "reserved_qty": 0,
    "low_stock_threshold": 2,
    "fulfilment_type": "made_to_order",
    "category": {
      "id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
      "name": "Area Rugs",
      "slug": "area-rugs",
      "image_url": null,
      "created_at": "2026-08-04T00:04:30.797601+00:00",
      "sort_order": 1,
      "description": "Statement floor pieces, hand-tufted to order."
    },
    "sizes": [
      {
        "id": "d8ca9583-0dd8-4252-b8cf-ef900b1c9376",
        "label": "L",
        "width_cm": 200,
        "height_cm": 300,
        "price_rwf": 870000,
        "price_usd": 595.89,
        "weight_kg": 22.8,
        "product_id": "21d42e32-070d-4640-8751-b85680f5ecdc",
        "sort_order": 3
      },
      {
        "id": "56a0430f-c212-4337-abce-7ab47a4bc9a0",
        "label": "M",
        "width_cm": 150,
        "height_cm": 220,
        "price_rwf": 480000,
        "price_usd": 328.77,
        "weight_kg": 12.5,
        "product_id": "21d42e32-070d-4640-8751-b85680f5ecdc",
        "sort_order": 2
      },
      {
        "id": "d5b85a7e-d624-4602-afee-41de9c881726",
        "label": "S",
        "width_cm": 120,
        "height_cm": 180,
        "price_rwf": 320000,
        "price_usd": 219.18,
        "weight_kg": 8.2,
        "product_id": "21d42e32-070d-4640-8751-b85680f5ecdc",
        "sort_order": 1
      }
    ],
    "images": [
      {
        "id": "0c4a8fe3-2105-4c1b-a0cc-498c165c6cea",
        "alt": "Hassan hand-tufted rug",
        "url": "/__l5e/assets-v1/10176d14-3299-443a-9708-a27203c5d214/hassan-1.jpg",
        "product_id": "21d42e32-070d-4640-8751-b85680f5ecdc",
        "sort_order": 0,
        "colorway_id": "Original"
      },
      {
        "id": "be82836a-2f2c-44ba-9e7e-803fed6ef470",
        "alt": "Hassan hand-tufted rug",
        "url": "/__l5e/assets-v1/12431968-acc8-4c32-a82e-2a0918a92e0b/hassan-2.jpg",
        "product_id": "21d42e32-070d-4640-8751-b85680f5ecdc",
        "sort_order": 1,
        "colorway_id": "Original"
      },
      {
        "id": "d80ad67f-c043-412a-b0a8-a050b994f847",
        "alt": "Hassan hand-tufted rug",
        "url": "/__l5e/assets-v1/71999378-5009-4b76-b34c-62a93ebed2a3/hassan-3.jpg",
        "product_id": "21d42e32-070d-4640-8751-b85680f5ecdc",
        "sort_order": 2,
        "colorway_id": "Original"
      },
      {
        "id": "a44765ab-af1a-4b81-ae94-4a77c2c222ab",
        "alt": "Hassan hand-tufted rug",
        "url": "/__l5e/assets-v1/719acfc1-0de1-4569-af43-92d7fb86992b/hassan-4.jpg",
        "product_id": "21d42e32-070d-4640-8751-b85680f5ecdc",
        "sort_order": 3,
        "colorway_id": "Variant 2"
      },
      {
        "id": "2da301d1-3613-40e4-ae56-40a500ded7da",
        "alt": "Hassan rug detail",
        "url": "/__l5e/assets-v1/28c325e7-6be3-44b6-8d49-e24f327dcc96/hassan-5.jpg",
        "product_id": "21d42e32-070d-4640-8751-b85680f5ecdc",
        "sort_order": 4,
        "colorway_id": "Variant 2"
      }
    ]
  },
  {
    "id": "f65eb29c-9d61-448d-85d4-7827347eb636",
    "slug": "valencia",
    "name": "Valencia",
    "category_id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
    "short_description": "Cream and gold with fine black line work.",
    "description": "Valencia runs rich brown and gold through a cream field, held together by confident black lines. Warm, graphic, and generous at full size.",
    "shape": "rectangle",
    "material": "Hand-tufted New Zealand wool",
    "production_time": "Ready in 3 to 4 weeks",
    "base_price_rwf": 320000,
    "base_price_usd": 219.18,
    "stock_status": "made_to_order",
    "featured": false,
    "featured_order": 9,
    "main_image_url": "/__l5e/assets-v1/2cbb95f3-b832-4e67-a626-6398c3ce7025/valencia-1.jpg",
    "color_palette": [
      "#C4571E",
      "#F2EFE9",
      "#1A1A1A"
    ],
    "tags": [
      "rectangle",
      "gold",
      "graphic"
    ],
    "is_published": true,
    "created_at": "2026-08-04T00:04:30.797601+00:00",
    "updated_at": "2026-09-02T12:53:41.359243+00:00",
    "hover_image_url": "/__l5e/assets-v1/2f4ec13c-1de2-42c4-bd9e-291fe0ee4abd/valencia-5.jpg",
    "colorways": [
      {
        "name": "Original",
        "colors": "Cream / white with rich brown gold and black lines"
      },
      {
        "name": "Variant 2",
        "colors": "Black and green"
      }
    ],
    "notes": null,
    "sku": "MSC-VALENC",
    "cost_rwf": null,
    "seo_title": null,
    "seo_description": null,
    "design_style": null,
    "care_instructions": null,
    "weight_kg": null,
    "archived_at": null,
    "stock_qty": 0,
    "reserved_qty": 0,
    "low_stock_threshold": 2,
    "fulfilment_type": "made_to_order",
    "category": {
      "id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
      "name": "Area Rugs",
      "slug": "area-rugs",
      "image_url": null,
      "created_at": "2026-08-04T00:04:30.797601+00:00",
      "sort_order": 1,
      "description": "Statement floor pieces, hand-tufted to order."
    },
    "sizes": [
      {
        "id": "c96587a4-47bc-40ce-83ac-c47f4e9668f0",
        "label": "L",
        "width_cm": 200,
        "height_cm": 300,
        "price_rwf": 870000,
        "price_usd": 595.89,
        "weight_kg": 22.8,
        "product_id": "f65eb29c-9d61-448d-85d4-7827347eb636",
        "sort_order": 3
      },
      {
        "id": "5d417b1f-ff3e-4aa0-81b5-9347c78f4099",
        "label": "M",
        "width_cm": 150,
        "height_cm": 220,
        "price_rwf": 480000,
        "price_usd": 328.77,
        "weight_kg": 12.5,
        "product_id": "f65eb29c-9d61-448d-85d4-7827347eb636",
        "sort_order": 2
      },
      {
        "id": "a56a9da7-8010-4c20-b8d0-637c53d948cb",
        "label": "S",
        "width_cm": 120,
        "height_cm": 180,
        "price_rwf": 320000,
        "price_usd": 219.18,
        "weight_kg": 8.2,
        "product_id": "f65eb29c-9d61-448d-85d4-7827347eb636",
        "sort_order": 1
      }
    ],
    "images": [
      {
        "id": "9d029458-46d9-43b6-a5f8-db13028364ac",
        "alt": "Valencia rug photographed flat with a cushion",
        "url": "/__l5e/assets-v1/2cbb95f3-b832-4e67-a626-6398c3ce7025/valencia-1.jpg",
        "product_id": "f65eb29c-9d61-448d-85d4-7827347eb636",
        "sort_order": 0,
        "colorway_id": "Original"
      },
      {
        "id": "a8f9162f-f419-4059-95b7-1b49cd967ed0",
        "alt": "Valencia rug in a living room between two sofas",
        "url": "/__l5e/assets-v1/2f4ec13c-1de2-42c4-bd9e-291fe0ee4abd/valencia-5.jpg",
        "product_id": "f65eb29c-9d61-448d-85d4-7827347eb636",
        "sort_order": 1,
        "colorway_id": "Original"
      },
      {
        "id": "80d69d80-24d3-4ae6-b44c-4b0c015d3458",
        "alt": "Reading on the Valencia rug",
        "url": "/__l5e/assets-v1/e6064fe1-3d5b-45a7-9da6-a7041c35bbe8/valencia-2.jpg",
        "product_id": "f65eb29c-9d61-448d-85d4-7827347eb636",
        "sort_order": 2,
        "colorway_id": "Original"
      },
      {
        "id": "0ec9d06d-277e-4443-ba0d-8c744962dc44",
        "alt": "Valencia rug styled with headphones and a bowl",
        "url": "/__l5e/assets-v1/761bb306-5a03-450a-afb2-1bf642ebb56a/valencia-4.jpg",
        "product_id": "f65eb29c-9d61-448d-85d4-7827347eb636",
        "sort_order": 3,
        "colorway_id": "Variant 2"
      },
      {
        "id": "fe4db481-6ef4-4da3-ba8c-85ed13d108c9",
        "alt": "Close up of the Valencia drip pattern",
        "url": "/__l5e/assets-v1/7b73fa5d-5a61-4b9c-80b2-daec17cfeecc/valencia-6.jpg",
        "product_id": "f65eb29c-9d61-448d-85d4-7827347eb636",
        "sort_order": 4,
        "colorway_id": "Variant 2"
      },
      {
        "id": "f9f79568-3d3f-45f3-94f4-74b96ee194e3",
        "alt": "Relaxing on the Valencia rug",
        "url": "/__l5e/assets-v1/0fc75c52-cdd4-4e61-b388-76c1a6d3b8a6/valencia-3.jpg",
        "product_id": "f65eb29c-9d61-448d-85d4-7827347eb636",
        "sort_order": 5,
        "colorway_id": "Variant 2"
      }
    ]
  },
  {
    "id": "5f607a7b-bcc3-4848-97cd-0239ea17608c",
    "slug": "uzu-circle",
    "name": "Uzu Circle (Enso)",
    "category_id": "13fc3743-15b2-4941-be4d-be1c8601b254",
    "short_description": "A single brown brushstroke circle on off white.",
    "description": "Uzu Circle borrows the enso: one continuous brown stroke on a cream ground, closed but never perfect. Works on the floor or on the wall.",
    "shape": "circular",
    "material": "Hand-tufted New Zealand wool",
    "production_time": "Ready in 3 to 4 weeks",
    "base_price_rwf": 170000,
    "base_price_usd": 116.44,
    "stock_status": "made_to_order",
    "featured": true,
    "featured_order": 8,
    "main_image_url": "/__l5e/assets-v1/c83a1a4b-98bf-4d4e-8b72-6c3d824989c9/uzu-1.jpg",
    "color_palette": [
      "#8E9A9D",
      "#E08A3C"
    ],
    "tags": [
      "circular",
      "neutral",
      "minimal"
    ],
    "is_published": true,
    "created_at": "2026-08-04T00:04:30.797601+00:00",
    "updated_at": "2026-09-02T12:53:41.359243+00:00",
    "hover_image_url": "/__l5e/assets-v1/4479a6cc-3887-45cb-86a1-3e16e50c3075/uzu-2.jpg",
    "colorways": [
      {
        "name": "Original",
        "colors": "Cream / off white with rich brown"
      }
    ],
    "notes": null,
    "sku": "MSC-UZUCIR",
    "cost_rwf": null,
    "seo_title": null,
    "seo_description": null,
    "design_style": null,
    "care_instructions": null,
    "weight_kg": null,
    "archived_at": null,
    "stock_qty": 0,
    "reserved_qty": 0,
    "low_stock_threshold": 2,
    "fulfilment_type": "made_to_order",
    "category": {
      "id": "13fc3743-15b2-4941-be4d-be1c8601b254",
      "name": "Wall Art Pieces",
      "slug": "wall-art",
      "image_url": null,
      "created_at": "2026-08-04T00:04:30.797601+00:00",
      "sort_order": 2,
      "description": "Tufted textile art made to hang."
    },
    "sizes": [
      {
        "id": "eaa354f8-d8e9-454a-a045-ceda66622a4a",
        "label": "L",
        "width_cm": 160,
        "height_cm": 160,
        "price_rwf": 290000,
        "price_usd": 198.63,
        "weight_kg": 7.6,
        "product_id": "5f607a7b-bcc3-4848-97cd-0239ea17608c",
        "sort_order": 3
      },
      {
        "id": "b3727592-3bda-4684-8f26-fe9df87f8dee",
        "label": "M",
        "width_cm": 140,
        "height_cm": 140,
        "price_rwf": 230000,
        "price_usd": 157.53,
        "weight_kg": 5.8,
        "product_id": "5f607a7b-bcc3-4848-97cd-0239ea17608c",
        "sort_order": 2
      },
      {
        "id": "ff5200cf-77f9-484d-8c1b-ffb1777bde41",
        "label": "S",
        "width_cm": 120,
        "height_cm": 120,
        "price_rwf": 170000,
        "price_usd": 116.44,
        "weight_kg": 4.3,
        "product_id": "5f607a7b-bcc3-4848-97cd-0239ea17608c",
        "sort_order": 1
      }
    ],
    "images": [
      {
        "id": "ac348c8d-b391-409b-97e6-b7b14cea81fc",
        "alt": "Uzu Circle hand-tufted rug",
        "url": "/__l5e/assets-v1/c83a1a4b-98bf-4d4e-8b72-6c3d824989c9/uzu-1.jpg",
        "product_id": "5f607a7b-bcc3-4848-97cd-0239ea17608c",
        "sort_order": 0,
        "colorway_id": null
      },
      {
        "id": "bc3d427c-99ee-465d-9a75-391a2e51f44f",
        "alt": "Uzu Circle hand-tufted rug",
        "url": "/__l5e/assets-v1/4479a6cc-3887-45cb-86a1-3e16e50c3075/uzu-2.jpg",
        "product_id": "5f607a7b-bcc3-4848-97cd-0239ea17608c",
        "sort_order": 1,
        "colorway_id": null
      }
    ]
  },
  {
    "id": "b7073578-f58e-4e45-9cc1-514396828a22",
    "slug": "valley",
    "name": "Valley",
    "category_id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
    "short_description": "Grey, khaki, brown and moss green in layered bands.",
    "description": "Valley stacks soft grey, khaki cream, brown and moss green into a landscape of bands. Quiet, earthy, easy to live with.",
    "shape": "rectangle",
    "material": "Hand-tufted New Zealand wool",
    "production_time": "Ready in 3 to 4 weeks",
    "base_price_rwf": 320000,
    "base_price_usd": 219.18,
    "stock_status": "made_to_order",
    "featured": false,
    "featured_order": 11,
    "main_image_url": "/__l5e/assets-v1/6f673edf-afa0-4232-8667-56122d3d818c/valley-2.jpg",
    "color_palette": [
      "#D9B36A",
      "#7DBB35",
      "#3A2416"
    ],
    "tags": [
      "rectangle",
      "green",
      "neutral",
      "new"
    ],
    "is_published": true,
    "created_at": "2026-08-04T00:04:30.797601+00:00",
    "updated_at": "2026-09-04T01:23:40.770779+00:00",
    "hover_image_url": "/__l5e/assets-v1/6068c4d9-f9b0-4fb9-a62b-072912c734e8/valley-1.jpg",
    "colorways": [
      {
        "name": "Original",
        "colors": "Grey, khaki cream, brown and moss green"
      }
    ],
    "notes": "Placeholder, details not yet finalised",
    "sku": "MSC-VALLEY",
    "cost_rwf": null,
    "seo_title": null,
    "seo_description": null,
    "design_style": null,
    "care_instructions": null,
    "weight_kg": null,
    "archived_at": null,
    "stock_qty": 0,
    "reserved_qty": 0,
    "low_stock_threshold": 2,
    "fulfilment_type": "made_to_order",
    "category": {
      "id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
      "name": "Area Rugs",
      "slug": "area-rugs",
      "image_url": null,
      "created_at": "2026-08-04T00:04:30.797601+00:00",
      "sort_order": 1,
      "description": "Statement floor pieces, hand-tufted to order."
    },
    "sizes": [
      {
        "id": "874d3ff1-a085-465d-9997-a5b1be17ceaa",
        "label": "L",
        "width_cm": 200,
        "height_cm": 300,
        "price_rwf": 870000,
        "price_usd": 595.89,
        "weight_kg": 22.8,
        "product_id": "b7073578-f58e-4e45-9cc1-514396828a22",
        "sort_order": 3
      },
      {
        "id": "7fbde55f-d7c7-4b93-8aa7-ba6e376499d9",
        "label": "M",
        "width_cm": 150,
        "height_cm": 220,
        "price_rwf": 480000,
        "price_usd": 328.77,
        "weight_kg": 12.5,
        "product_id": "b7073578-f58e-4e45-9cc1-514396828a22",
        "sort_order": 2
      },
      {
        "id": "6bafeeaa-7024-4d60-b9e7-3cf6d709c050",
        "label": "S",
        "width_cm": 120,
        "height_cm": 180,
        "price_rwf": 320000,
        "price_usd": 219.18,
        "weight_kg": 8.2,
        "product_id": "b7073578-f58e-4e45-9cc1-514396828a22",
        "sort_order": 1
      }
    ],
    "images": [
      {
        "id": "e907fda0-df3f-4446-ba6b-f6df974825e5",
        "alt": "Valley hand-tufted rug",
        "url": "/__l5e/assets-v1/6f673edf-afa0-4232-8667-56122d3d818c/valley-2.jpg",
        "product_id": "b7073578-f58e-4e45-9cc1-514396828a22",
        "sort_order": 0,
        "colorway_id": null
      },
      {
        "id": "9fb059d8-9130-46b3-8a79-32828a4f0134",
        "alt": "Valley hand-tufted rug",
        "url": "/__l5e/assets-v1/6068c4d9-f9b0-4fb9-a62b-072912c734e8/valley-1.jpg",
        "product_id": "b7073578-f58e-4e45-9cc1-514396828a22",
        "sort_order": 1,
        "colorway_id": null
      },
      {
        "id": "6546fa5d-b17c-4f87-a5cd-ef65d9f0780a",
        "alt": "Valley rug in a living room",
        "url": "/__l5e/assets-v1/074246a2-d88c-4a8b-914b-d38c7182cc20/valley-3.jpg",
        "product_id": "b7073578-f58e-4e45-9cc1-514396828a22",
        "sort_order": 2,
        "colorway_id": null
      }
    ]
  },
  {
    "id": "63fe983d-bb36-4705-bd61-40bdc63f425b",
    "slug": "geometric",
    "name": "Geometric",
    "category_id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
    "short_description": "Tan and beige ground with multi colour geometric accents.",
    "description": "Geometric layers bright multi colour blocks over a warm tan field. Playful without shouting, and built to take daily traffic.",
    "shape": "rectangle",
    "material": "Hand-tufted New Zealand wool",
    "production_time": "Ready in 3 to 4 weeks",
    "base_price_rwf": 320000,
    "base_price_usd": 219.18,
    "stock_status": "out_of_stock",
    "featured": true,
    "featured_order": 4,
    "main_image_url": "/__l5e/assets-v1/410edc13-8f3d-4b3d-8294-134006f103d3/geometric-1.jpg",
    "color_palette": [
      "#E8A400",
      "#1F7A5A",
      "#C6303A",
      "#3D7EA6"
    ],
    "tags": [
      "rectangle",
      "multicolour",
      "geometric"
    ],
    "is_published": true,
    "created_at": "2026-08-04T00:04:30.797601+00:00",
    "updated_at": "2026-09-04T01:23:31.221098+00:00",
    "hover_image_url": "/__l5e/assets-v1/5205602f-02e7-4eeb-a1cd-5ee1cc9542e0/geometric-2.jpg",
    "colorways": [
      {
        "name": "Original",
        "colors": "Tan / beige ground with multi colour accents"
      },
      {
        "name": "Variant 2",
        "colors": "Moss green"
      }
    ],
    "notes": null,
    "sku": "MSC-GEOMET",
    "cost_rwf": null,
    "seo_title": "",
    "seo_description": "",
    "design_style": null,
    "care_instructions": "",
    "weight_kg": null,
    "archived_at": null,
    "stock_qty": 0,
    "reserved_qty": 0,
    "low_stock_threshold": 2,
    "fulfilment_type": "made_to_order",
    "category": {
      "id": "6f4b5bfe-0ddd-4a60-bb7a-a8b95a999bc3",
      "name": "Area Rugs",
      "slug": "area-rugs",
      "image_url": null,
      "created_at": "2026-08-04T00:04:30.797601+00:00",
      "sort_order": 1,
      "description": "Statement floor pieces, hand-tufted to order."
    },
    "sizes": [
      {
        "id": "52ec1ca7-8c27-4580-8d93-888cde6a6952",
        "label": "S",
        "width_cm": 120,
        "height_cm": 180,
        "price_rwf": 320000,
        "price_usd": 219.18,
        "weight_kg": 8.2,
        "product_id": "63fe983d-bb36-4705-bd61-40bdc63f425b",
        "sort_order": 0
      },
      {
        "id": "03e84285-4ce4-4ff5-a2c2-9228f6be80d0",
        "label": "M",
        "width_cm": 150,
        "height_cm": 220,
        "price_rwf": 480000,
        "price_usd": 328.77,
        "weight_kg": 12.5,
        "product_id": "63fe983d-bb36-4705-bd61-40bdc63f425b",
        "sort_order": 1
      },
      {
        "id": "fe0a0e9b-32e9-43a3-9eac-46e39f9c14ae",
        "label": "L",
        "width_cm": 200,
        "height_cm": 300,
        "price_rwf": 870000,
        "price_usd": 595.89,
        "weight_kg": 22.8,
        "product_id": "63fe983d-bb36-4705-bd61-40bdc63f425b",
        "sort_order": 2
      }
    ],
    "images": [
      {
        "id": "de80e740-5289-45d7-9bd0-9c3cad2438ea",
        "alt": "Geometric rug in a bright Kigali living room",
        "url": "/__l5e/assets-v1/410edc13-8f3d-4b3d-8294-134006f103d3/geometric-1.jpg",
        "product_id": "63fe983d-bb36-4705-bd61-40bdc63f425b",
        "sort_order": 0,
        "colorway_id": null
      },
      {
        "id": "07319b45-2cc9-4b54-9479-cbc4e4da144f",
        "alt": "Overhead view of the Geometric rug colour blocks",
        "url": "/__l5e/assets-v1/5205602f-02e7-4eeb-a1cd-5ee1cc9542e0/geometric-2.jpg",
        "product_id": "63fe983d-bb36-4705-bd61-40bdc63f425b",
        "sort_order": 1,
        "colorway_id": null
      },
      {
        "id": "fdecc646-7bd3-428f-86eb-0455bbfe98e0",
        "alt": "Geometric rug styled beside a sofa",
        "url": "/__l5e/assets-v1/a47a0de6-8ab3-4251-b78e-2d86cb34b29d/geometric-3.jpg",
        "product_id": "63fe983d-bb36-4705-bd61-40bdc63f425b",
        "sort_order": 2,
        "colorway_id": null
      },
      {
        "id": "c9fd6eff-bf79-4936-87a8-e67492382a9f",
        "alt": "Close up of the Geometric rug wool pile",
        "url": "/__l5e/assets-v1/58cfc153-48d5-4aab-9fd0-e5367ce56886/geometric-4.jpg",
        "product_id": "63fe983d-bb36-4705-bd61-40bdc63f425b",
        "sort_order": 3,
        "colorway_id": null
      }
    ]
  }
] as unknown as Product[];

export const fallbackReviews = [
  {
    "id": "1e5473c8-dc8a-42cd-a11f-a10816e4968f",
    "customer_name": "Aline M.",
    "location": "Kigali",
    "rating": 5,
    "quote": "I brought them a doodle of my dog and they turned it into a rug that stops every guest in their tracks. Unreal craftsmanship.",
    "is_visible": true,
    "sort_order": 1,
    "created_at": "2026-07-20T22:24:44.94876+00:00"
  },
  {
    "id": "a17b9f45-0f90-45ca-86a3-5527ec3b539a",
    "customer_name": "David K.",
    "location": "Kimihurura",
    "rating": 5,
    "quote": "The colours are richer than I imagined, and it feels dense and heavy in the best way. Worth every franc.",
    "is_visible": true,
    "sort_order": 2,
    "created_at": "2026-07-20T22:24:44.94876+00:00"
  },
  {
    "id": "b168fe48-6089-443b-a0b5-8d104487e937",
    "customer_name": "Sarah B.",
    "location": "Nyarutarama",
    "rating": 5,
    "quote": "From the first WhatsApp to delivery was three weeks. They confirmed every detail. Genuinely thoughtful people.",
    "is_visible": true,
    "sort_order": 3,
    "created_at": "2026-07-20T22:24:44.94876+00:00"
  }
];
