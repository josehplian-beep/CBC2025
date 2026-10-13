# Architecture
- Store testimonies and devotional posts in `testimonials`, distinguished by `content_type`; reuse the Messages editor so both sections share publishing and access controls.
- Render devotional content as plain text paragraphs, never executable author HTML; sharing embeds use a dedicated read-only post route.