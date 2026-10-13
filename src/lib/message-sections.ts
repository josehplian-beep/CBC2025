export const messageSections = [
  { name: 'Rooted Thoughts', path: '/rooted-thoughts' },
  { name: 'Testimonies', path: '/testimony' },
] as const;

export type MessageSectionPath = typeof messageSections[number]['path'];