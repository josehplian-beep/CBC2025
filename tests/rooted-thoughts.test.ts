import { describe, expect, test } from 'bun:test';
import { hasPermission, type UserRole } from '../src/lib/permissions';
import { postEmbed, postPath, postMetadata } from '../src/lib/rooted-thoughts';
import { messageSections } from '../src/lib/message-sections';

describe('Rooted Thoughts shares Message editing access', () => {
  test('editors can manage posts', () => expect(hasPermission('editor', 'manage_testimonies')).toBe(true));
  test('administrators can manage posts', () => expect(hasPermission('administrator', 'manage_testimonies')).toBe(true));
  test.each(['member', 'teacher', 'staff', 'viewer'] as UserRole[])('%s cannot manage posts', role => {
    expect(hasPermission(role, 'manage_testimonies')).toBe(false);
  });
});

test('message switching puts Rooted Thoughts first and sends each selection to its own listing', () => {
  expect(messageSections[0].path).toBe('/rooted-thoughts');
  expect(messageSections[1].path).toBe('/testimony');
  expect(messageSections).toHaveLength(2);
});

test('post links resolve custom names and embeds to the same reflection', () => {
  const post = { id: '123', slug: 'rooted-in-hope', title: 'Hope "today" <script>' };
  expect(postPath(post)).toBe('/rooted-thoughts/rooted-in-hope');
  const html = postEmbed('https://chinbethelchurch.com', post);
  expect(html).toContain('src="https://chinbethelchurch.com/rooted-thoughts/rooted-in-hope/embed"');
  expect(html).not.toContain('<script>');
});

test('individual sharing uses the post cover and self-referencing public URL', () => {
  const metadata = postMetadata({ id: '123', slug: 'rooted-in-hope', title: 'Rooted in hope', content: 'A reflection on hope.', image_url: 'https://chinbethelchurch.com/covers/hope.jpg' });
  expect(metadata.url).toBe('https://chinbethelchurch.com/rooted-thoughts/rooted-in-hope');
  expect(metadata.image).toBe('https://chinbethelchurch.com/covers/hope.jpg');
  expect(metadata.title).toBe('Rooted in hope');
  expect(metadata.description).toBe('A reflection on hope.');
});

test('missing or private covers never fall back to the homepage cover', () => {
  const post = { id: '123', slug: null, title: 'Hope', content: 'Hope today.' };
  expect(postMetadata({ ...post, image_url: null }).image).toBeUndefined();
  expect(postMetadata({ ...post, image_url: 'https://example.com/storage/v1/object/sign/cover.jpg?token=expired' }).image).toBeUndefined();
});