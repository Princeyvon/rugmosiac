import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

startTransition(() => {
  try {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>,
    );
  } catch (err) {
    console.error("[Client Hydration Error]", err);
  }
});
