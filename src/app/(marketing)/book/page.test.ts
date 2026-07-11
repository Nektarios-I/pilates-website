import { describe, expect, it } from 'vitest';

import { metadata } from '@/app/(marketing)/book/page';

describe('BookPage metadata', () => {
  it('exposes public booking route metadata', () => {
    expect(metadata.title).toContain('Book');
    expect(metadata.description).toMatch(/Pilates/i);
  });
});
