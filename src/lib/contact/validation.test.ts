import { describe, expect, it } from 'vitest';

import { normalize_contact_input, validate_contact_input } from './validation';

describe('validate_contact_input', () => {
  const valid = {
    name: 'Maria Papadopoulou',
    email: 'maria@example.com',
    phone: '+357 99 954286',
    message: 'I would like to book a reformer intro class.',
  };

  it('accepts a valid submission', () => {
    expect(validate_contact_input(valid)).toBeNull();
  });

  it('rejects invalid email', () => {
    expect(validate_contact_input({ ...valid, email: 'not-an-email' })).toMatch(/valid email/i);
  });

  it('rejects short phone numbers', () => {
    expect(validate_contact_input({ ...valid, phone: '123' })).toMatch(/phone/i);
  });

  it('normalizes whitespace', () => {
    expect(
      normalize_contact_input({
        name: '  Maria   Papadopoulou ',
        email: ' MARIA@Example.COM ',
        phone: '  +357 99 954286 ',
        message: '  Hello there studio team. ',
      }),
    ).toEqual({
      name: 'Maria Papadopoulou',
      email: 'maria@example.com',
      phone: '+357 99 954286',
      message: 'Hello there studio team.',
    });
  });
});
