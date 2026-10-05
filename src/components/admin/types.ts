export type SizeRow = {
  id?: string;
  label: string;
  width_cm: number | null;
  height_cm: number | null;
  price_rwf: number | null;
  weight_kg: number | null;
  sort_order: number;
};

export type ArtisanalSpecs = {
  // Provenance & Studio Identification
  romanSequence: string; // e.g., "VOL. IX" or "N° 04"
  atelierSku: string; // e.g., "MOS-VOL-009"
  capsuleSeries: string; // e.g., "Heritage Earth", "Kigali Architectural"
  provenanceBackstory: string;
  inspirationStatement: string;
  masterWeaver: string; // e.g., "Uwase Marie & Atelier Team"
  workshopId: string; // e.g., "Kigali Nyamirambo Atelier 02"
  
  // Craft & Material Composition
  constructionTechnique: "hand_tufted" | "hand_knotted" | "flatweave_kilim" | "relief_carved" | "loop_cut_pile";
  fiberComposition: string; // e.g., "80% Rwandan Highland Wool / 20% Botanical Bamboo Silk"
  dyeFormulation: "vegetable_botanical" | "mineral_ochre" | "indigo_ferment" | "reactive_synthetic";
  pileHeightMm: number; // e.g., 12
  shearingFinish: "hand_sheared_bevelled" | "relief_carving" | "looped_boucle" | "plush_cut";
  knotDensityPerSqm: number; // e.g., 96,000
  backingFinish: string; // e.g., "100% Organic Cotton Herringbone binding, natural hypoallergenic latex seal"
  
  // Raw Material & Fair-Wage Cost Breakdown
  rawMaterials: {
    woolKg: number;
    woolRateRwfPerKg: number;
    foundationClothRwf: number;
    latexRwf: number;
    edgeBindingRwf: number;
  };
  labor: {
    weavingHours: number;
    hourlyRateRwf: number;
  };
  atelierMarkupPercent: number; // e.g. 45%
  logisticsRwf: number; // e.g. packaging & dispatch
  compareAtPriceRwf: number | null; // Promotional/Archival anchor price
  rushFeePercent: number; // e.g. 25%
};

export const DEFAULT_ARTISANAL_SPECS: ArtisanalSpecs = {
  romanSequence: "VOL. I",
  atelierSku: "MOS-UZU-001",
  capsuleSeries: "Highland Heritage",
  provenanceBackstory: "Handcrafted in the hills of Kigali utilizing centuries-old weaving knowledge passed down through generations of Rwandan textile masters.",
  inspirationStatement: "Sculptural topography and geometric basalt formations found along the Albertine Rift.",
  masterWeaver: "Marie Mukamana, Master Weaver",
  workshopId: "Kigali Atelier 01",
  constructionTechnique: "hand_tufted",
  fiberComposition: "80% Rwandan Highland Wool / 20% Botanical Bamboo Silk",
  dyeFormulation: "vegetable_botanical",
  pileHeightMm: 12,
  shearingFinish: "hand_sheared_bevelled",
  knotDensityPerSqm: 88000,
  backingFinish: "100% Cotton Herringbone binding, natural organic latex seal",
  rawMaterials: {
    woolKg: 8.5,
    woolRateRwfPerKg: 14000,
    foundationClothRwf: 25000,
    latexRwf: 18000,
    edgeBindingRwf: 12000,
  },
  labor: {
    weavingHours: 48,
    hourlyRateRwf: 4500,
  },
  atelierMarkupPercent: 40,
  logisticsRwf: 20000,
  compareAtPriceRwf: null,
  rushFeePercent: 25,
};

export function parseArtisanalSpecs(notesRaw: string | null | undefined): ArtisanalSpecs {
  if (!notesRaw) return { ...DEFAULT_ARTISANAL_SPECS };
  try {
    const parsed = JSON.parse(notesRaw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        ...DEFAULT_ARTISANAL_SPECS,
        ...parsed,
        rawMaterials: {
          ...DEFAULT_ARTISANAL_SPECS.rawMaterials,
          ...(parsed.rawMaterials || {}),
        },
        labor: {
          ...DEFAULT_ARTISANAL_SPECS.labor,
          ...(parsed.labor || {}),
        },
      };
    }
  } catch {
    // If notes was plain text, keep it as backstory
    return {
      ...DEFAULT_ARTISANAL_SPECS,
      provenanceBackstory: notesRaw,
    };
  }
  return { ...DEFAULT_ARTISANAL_SPECS };
}

export function serializeArtisanalSpecs(specs: ArtisanalSpecs): string {
  return JSON.stringify(specs);
}

/** Converts cm to feet & inches string (e.g. 180cm -> 5'11") */
export function cmToFeetInches(cm: number | null | undefined): string {
  if (!cm || cm <= 0) return "-";
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

/** Automatic weight estimation: Area in m2 × 3.8 kg/m2 (or pile density factor) */
export function calculateWeightKg(shape: string, widthCm: number | null, heightCm: number | null, pileFactor = 3.8): number | null {
  if (!widthCm || widthCm <= 0) return null;
  let area = 0;
  if (shape === "circular") {
    const radiusM = (widthCm / 200);
    area = Math.PI * radiusM * radiusM;
  } else if (heightCm && heightCm > 0) {
    area = (widthCm / 100) * (heightCm / 100);
  } else {
    return null;
  }
  return Math.round(area * pileFactor * 10) / 10;
}
