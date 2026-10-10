# Architecture rules
- Lookbook previews and downloads use the persisted PDF URL, not unversioned browser blobs, so every visitor receives the published document.
- Studio lookbook success states and client cache updates occur only after the server confirms persistence, so failed uploads cannot appear published.
- Operational dashboard values use real records only; empty datasets stay empty rather than invoking demo fallbacks.
- Verified purchaser reviews are persisted in Cloud site settings, never written to a worker filesystem, so moderation survives deployment.