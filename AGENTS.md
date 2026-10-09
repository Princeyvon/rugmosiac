# Architecture rules
- Lookbook previews and downloads use the persisted PDF URL, not unversioned browser blobs, so every visitor receives the published document.
- Studio lookbook success states and client cache updates occur only after the server confirms persistence, so failed uploads cannot appear published.