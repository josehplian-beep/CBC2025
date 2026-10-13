export function postPath(post: { slug: string | null; id: string }) {
  return `/rooted-thoughts/${post.slug || post.id}`;
}

export const publicSiteOrigin = 'https://chinbethelchurch.com';

export function postMetadata(post: { id: string; slug: string | null; title: string; content: string; image_url: string | null }) {
  const url = publicSiteOrigin + postPath(post);
  let image: string | undefined;
  if (post.image_url) {
    try {
      const cover = new URL(post.image_url, publicSiteOrigin);
      if (cover.protocol === 'https:' && !cover.searchParams.has('token') && !cover.pathname.includes('/object/sign/')) image = cover.href;
    } catch { /* Invalid covers are not shareable. */ }
  }
  return { url, title: post.title, description: excerpt(post.content), image };
}

export function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function postEmbed(origin: string, post: { slug: string | null; id: string; title: string }) {
  return `<iframe src="${escapeAttribute(origin + postPath(post) + '/embed')}" title="${escapeAttribute(post.title)}" width="100%" height="520" loading="lazy" style="border:0" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>`;
}

export function excerpt(content: string, length = 170) {
  const text = content.replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}