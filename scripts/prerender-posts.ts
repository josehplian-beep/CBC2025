import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const SITE = "https://chinbethelchurch.com";
const SUPABASE_URL = "https://auztoefiuddwerfbpcpm.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1enRvZWZpdWRkd2VyZmJwY3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NjQwNDcsImV4cCI6MjA3NjM0MDA0N30.hQFOBZSxmtEedImOsLNoy6u_5s7EzRJ0t5klvyzXgtU";

export type SharePost = {
  id: string;
  slug: string | null;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  content_type: string;
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const sharePath = (post: SharePost) =>
  post.content_type === "rooted_thought" ? `/rooted-thoughts/${post.slug}` : `/testimony/${post.id}`;

export function postHead(post: SharePost) {
  const url = SITE + sharePath(post);
  const title = `${post.title} | Chin Bethel Church`;
  const description = (post.content ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Chin Bethel Church" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="article:published_time" content="${escapeHtml(post.created_at)}" />`,
    `<meta name="twitter:card" content="${post.image_url ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  ];
  if (post.image_url?.startsWith("https://")) {
    tags.push(
      `<meta property="og:image" content="${escapeHtml(post.image_url)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(post.image_url)}" />`,
    );
  }
  return tags.join("\n    ");
}

export function renderPostHtml(template: string, post: SharePost) {
  const stripped = template
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="(description|twitter:[^"]+)"[\s\S]*?>/gi, "")
    .replace(/<meta\s+property="(og|article):[^"]+"[\s\S]*?>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "");
  return stripped.replace("</head>", `    ${postHead(post)}\n  </head>`);
}

async function fetchPosts(): Promise<SharePost[]> {
  const query = "select=id,slug,title,content,image_url,created_at,content_type&is_published=eq.true";
  const response = await fetch(`${SUPABASE_URL}/rest/v1/testimonials?${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!response.ok) throw new Error(`Post fetch failed: ${response.status}`);
  return (await response.json()) as SharePost[];
}

export function prerenderPosts(): Plugin {
  let outDir = "dist";
  return {
    name: "prerender-post-share-pages",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      try {
        const template = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
        const posts = (await fetchPosts()).filter(post => post.content_type !== "rooted_thought" || post.slug);
        for (const post of posts) {
          const dir = path.join(outDir, sharePath(post));
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, "index.html"), renderPostHtml(template, post));
        }
        console.log(`Prerendered share pages for ${posts.length} posts`);
      } catch (error) {
        console.warn("Skipped post share pages:", error);
      }
    },
  };
}
