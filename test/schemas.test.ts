import { describe, expect, test } from 'bun:test';
import { backupSchema, normalizePhone, putEntrySchema, signUpSchema } from '../src/shared/schemas';

describe('normalizePhone', () => {
  test('defaults to Malaysian numbers', () => {
    expect(normalizePhone('012-345 6789', 'MY')).toBe('+60123456789');
    expect(normalizePhone('0123456789', 'MY')).toBe('+60123456789');
  });

  test('accepts international format regardless of country', () => {
    expect(normalizePhone('+60 12-345 6789', 'US')).toBe('+60123456789');
    expect(normalizePhone('+44 7911 123456', 'MY')).toBe('+447911123456');
  });

  test('rejects invalid numbers', () => {
    expect(normalizePhone('123', 'MY')).toBeNull();
    expect(normalizePhone('not a phone', 'MY')).toBeNull();
  });
});

describe('signUpSchema', () => {
  const valid = { username: 'aisha_1', email: 'a@b.co', phone: '0123456789', password: 'longenough' };

  test('accepts a valid sign-up and defaults the country to MY', () => {
    const r = signUpSchema.parse(valid);
    expect(r.phoneCountry).toBe('MY');
  });

  test('rejects bad usernames, emails and short passwords', () => {
    expect(signUpSchema.safeParse({ ...valid, username: 'a b' }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
  });
});

describe('entries', () => {
  test('sketch must be an image data URL or null', () => {
    expect(putEntrySchema.safeParse({ sketch: 'data:image/jpeg;base64,AAAA' }).success).toBe(true);
    expect(putEntrySchema.safeParse({ sketch: null }).success).toBe(true);
    expect(putEntrySchema.safeParse({ sketch: 'javascript:alert(1)' }).success).toBe(false);
  });

  test('accepts the original journal backup format', () => {
    const r = backupSchema.safeParse({
      app: 'welcome-home-journal',
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      profile: { name: 'Aisha' },
      days: { '1': { text: 'hello', updatedAt: 1, sketch: null } },
    });
    expect(r.success).toBe(true);
  });
});
