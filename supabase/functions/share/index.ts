import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://chinbethelchurch.com';
const FALLBACK_IMAGE = `${SITE}/pwa-512x512.png`;
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);

const escape = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const summary = (text: string, length = 170) => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean;
};
const publicImage = (url: string | null) => {
  if (!url) return null;
  try {
    const u = new URL(url, SITE);
    if (u.protocol !== 'https:' || u.searchParams.has('token') || u.pathname.includes('/object/sign/')) return null;
    return u.href;
  } catch { return null; }
};
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

async function lookup(path: string) {
  const [, section, key] = path.split('/');
  if (!key || key.length > 200) return null;

  if (section === 'rooted-thoughts' || section === 'testimony') {
    const type = section === 'testimony' ? 'testimony' : 'rooted_thought';
    let query = supabase.from('testimonials').select('id, slug, title, content, image_url, author_name, created_at, content_type').eq('is_published', true);
    query = isUuid(key) ? query.or(`id.eq.${key},slug.eq.${key}`) : query.eq('slug', key);
    const { data } = await query.maybeSingle();
    if (!data) return null;
    const label = data.content_type === 'testimony' ? 'Testimony' : 'Rooted Thoughts';
    return { title: `${data.title} | ${label}`, description: summary(data.content), image: publicImage(data.image_url), type: 'article', path };
  }

  if (section === 'e' || section === 'events') {
    let query = supabase.from('events').select('id, slug, title, description, date, time, location, image_url');
    query = isUuid(key) ? query.eq('id', key) : query.eq('slug', key);
    const { data } = await query.maybeSingle();
    if (!data) return null;
    const when = `${data.date} at ${data.time} • ${data.location}`;
    return { title: `${data.title} — Chin Bethel Church`, description: summary(data.description ? `${when}. ${data.description}` : when), image: publicImage(data.image_url), type: 'website', path };
  }
  return null;
}

Deno.serve(async (req) => {
  const requestUrl = new URL(req.url);
  const path = requestUrl.searchParams.get('path') || '/';
  const safePath = /^\/[A-Za-z0-9\-_/]*$/.test(path) ? path : '/';
  const meta = await lookup(safePath).catch(() => null);
  const target = SITE + safePath;
  const title = meta?.title || 'Chin Bethel Church | MD';
  const description = meta?.description || 'Chin Bethel Church in Maryland.';
  const image = meta?.image || FALLBACK_IMAGE;
  const self = `${requestUrl.origin}${requestUrl.pathname}?path=${encodeURIComponent(safePath)}`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="canonical" href="${escape(target)}">
<meta property="og:site_name" content="Chin Bethel Church">
<meta property="og:type" content="${meta?.type || 'website'}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${escape(self)}">
<meta property="og:image" content="${escape(image)}">
<meta property="og:image:alt" content="${escape(title)}">
<meta name="twitter:card" content="${meta?.image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${escape(image)}">
<meta http-equiv="refresh" content="0; url=${escape(target)}">
</head><body><a href="${escape(target)}">${escape(title)}</a></body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
});
