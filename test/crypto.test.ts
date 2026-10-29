import { describe, expect, test } from 'bun:test';
import { DUMMY_HASH, generatePassword, hashPassword, randomToken, sha256Hex, verifyPassword } from '../src/worker/crypto';

describe('password hashing', () => {
  test('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse');
    expect(hash).toStartWith('pbkdf2_sha256$100000$');
    expect(await verifyPassword('correct horse', hash)).toBe(true);
    expect(await verifyPassword('correct horsf', hash)).toBe(false);
  });

  test('salts each hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  test('rejects malformed or dummy hashes', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false);
    expect(await verifyPassword('x', DUMMY_HASH)).toBe(false);
  });
});

describe('tokens', () => {
  test('random tokens are url-safe and unique', () => {
    const a = randomToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomToken()).not.toBe(a);
  });

  test('sha256Hex matches a known digest', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  test('generated passwords avoid look-alike characters', () => {
    const p = generatePassword();
    expect(p).toHaveLength(12);
    expect(p).not.toMatch(/[0O1lI]/);
  });
});
