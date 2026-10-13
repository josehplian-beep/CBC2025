import { describe, expect, test } from 'bun:test';
import { hasPermission, type UserRole } from '../src/lib/permissions';
import { postEmbed, postPath } from '../src/lib/rooted-thoughts';
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