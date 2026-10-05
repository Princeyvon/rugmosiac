import { useState, useEffect } from "react";
import { getLiveSlotImage, type FeaturedImageSlot } from "./site-images";

let globalOverrides: Record<string, string> = {};
let hasLoaded = false;
const listeners = new Set<(overrides: Record<string, string>) => void>();

export function updateClientOverrides(newOverrides: Record<string, string>) {
  globalOverrides = { ...newOverrides };
  listeners.forEach((l) => l(globalOverrides));
}

/**
 * React hook to access a specific site featured image by slotId.
 * Reactive across live admin updates.
 */
export function useFeaturedImage(slotId: string, defaultFallback: string): string {
  const [url, setUrl] = useState<string>(() =>
    getLiveSlotImage(slotId, globalOverrides, defaultFallback)
  );

  useEffect(() => {
    // If not loaded yet, fetch initial config
    if (!hasLoaded) {
      hasLoaded = true;
      import("@/lib/site-images.functions")
        .then(({ getSiteImagesData }) => getSiteImagesData())
        .then((res) => {
          if (res?.overrides) {
            updateClientOverrides(res.overrides);
          }
        })
        .catch(() => {});
    }

    const handler = (newOverrides: Record<string, string>) => {
      setUrl(getLiveSlotImage(slotId, newOverrides, defaultFallback));
    };

    listeners.add(handler);
    setUrl(getLiveSlotImage(slotId, globalOverrides, defaultFallback));

    return () => {
      listeners.delete(handler);
    };
  }, [slotId, defaultFallback]);

  return url;
}
