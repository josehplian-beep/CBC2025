import { expect, test } from "bun:test";
import { renderPostHtml } from "../scripts/prerender-posts";

const template = `<html><head><title>Home</title><meta property="og:image" content="https://x/home.webp"><meta name="description" content="home"></head><body></body></html>`;

test("post page replaces homepage cover and title with the post's own", () => {
  const html = renderPostHtml(template, { id: "1", slug: "beautiful-savior", title: "Beautiful Savior", content: "Grace.", image_url: "https://cdn/post.jpg", created_at: "2026-01-01", content_type: "rooted_thought" });
  expect(html).not.toContain("home.webp");
  expect(html).toContain('content="https://cdn/post.jpg"');
  expect(html).toContain("<title>Beautiful Savior | Chin Bethel Church</title>");
  expect(html).toContain('href="https://chinbethelchurch.com/rooted-thoughts/beautiful-savior"');
});
