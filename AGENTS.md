# Architecture
- Store testimonies and devotional posts in `testimonials`, distinguished by `content_type`; reuse the Messages editor so both sections share publishing and access controls.
- Render devotional content as plain text paragraphs, never executable author HTML; sharing embeds use a dedicated read-only post route.
- Keep message section destinations in one shared definition and use the same route-driven selector on both listings so switching stays consistent.
- Derive devotional sharing metadata through a shared helper using the public site origin and only public post covers; client-side head tags alone do not verify crawler previews on static hosting.