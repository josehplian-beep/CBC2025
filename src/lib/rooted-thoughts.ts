export function postPath(post: { slug: string | null; id: string }) {
  return `/rooted-thoughts/${post.slug || post.id}`;
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