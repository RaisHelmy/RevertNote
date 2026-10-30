import { z } from 'zod';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';

export const DAY_COUNT = 40;
export const MAX_SKETCH_CHARS = 1_500_000;
export const MAX_TEXT_CHARS = 100_000;

/** Normalizes a national or international number to E.164, or null when invalid. */
export function normalizePhone(raw: string, country: string): string | null {
  const parsed = parsePhoneNumberFromString(raw.trim(), country.toUpperCase() as CountryCode);
  return parsed && parsed.isValid() ? parsed.number : null;
}

const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_.]+$/, 'Username may only contain letters, numbers, _ and .');

const email = z.string().trim().max(254).pipe(z.email('Enter a valid email address'));

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password is too long');

const country = z.string().length(2).default('MY');

export const phoneInput = z.object({
  phone: z.string().trim().min(3, 'Enter a phone number').max(32),
  phoneCountry: country,
});

export const signUpSchema = z
  .object({ username, email, password })
  .extend(phoneInput.shape);

export const signInSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your username, email or phone').max(254),
  password: z.string().min(1, 'Enter your password').max(200),
  phoneCountry: country,
});

export const updateMeSchema = z.object({
  displayName: z.string().trim().max(40).optional(),
  welcomed: z.boolean().optional(),
  lastDay: z.number().int().min(1).max(DAY_COUNT).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: password,
});

const sketch = z
  .string()
  .max(MAX_SKETCH_CHARS, 'Drawing is too large')
  .regex(/^data:image\/(jpeg|png|webp);base64,/, 'Drawing must be an image data URL')
  .nullable();

export const putEntrySchema = z.object({
  text: z.string().max(MAX_TEXT_CHARS).optional(),
  sketch: sketch.optional(),
});

/** The backup format written by the original single-file journal. */
export const backupSchema = z.object({
  app: z.literal('welcome-home-journal'),
  version: z.number().optional(),
  profile: z.object({ name: z.string().optional() }).optional(),
  days: z.record(
    z.string(),
    z.object({
      text: z.string().max(MAX_TEXT_CHARS).optional(),
      sketch: z.string().max(MAX_SKETCH_CHARS).nullable().optional(),
      updatedAt: z.number().optional(),
    }),
  ),
});

export const role = z.enum(['user', 'admin']);
export const status = z.enum(['active', 'disabled']);

export const adminCreateUserSchema = signUpSchema.extend({
  displayName: z.string().trim().max(40).optional(),
  role: role.default('user'),
});

export const adminUpdateUserSchema = z.object({
  username: username.optional(),
  email: email.optional(),
  phone: z.string().trim().min(3).max(32).optional(),
  phoneCountry: country,
  displayName: z.string().trim().max(40).optional(),
  role: role.optional(),
  status: status.optional(),
});

export const adminResetPasswordSchema = z.object({
  password: password.optional(),
});

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignInInput = z.input<typeof signInSchema>;

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  displayName: string;
  welcomed: boolean;
  role: 'user' | 'admin';
  status: 'active' | 'disabled';
  lastDay: number;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
}

export interface EntryMeta {
  day: number;
  text: string;
  hasSketch: boolean;
  updatedAt: number;
}

export interface Entry extends EntryMeta {
  sketch: string | null;
}

export interface AdminUserRow extends PublicUser {
  daysLit: number;
}

/** Free-text fields of the "My Shahadah Story" page. Keys are fixed; values are capped. */
export const STORY_FIELDS = [
  'legalName',
  'muslimName',
  'becoming',
  'why',
  'people',
  'duaList',
  'gratitudeList',
  'learned',
  'challenge',
  'dua',
] as const;
export const STORY_ROWS = 4;

const storyText = z.string().max(10_000);
export const storySchema = z.object({
  fields: z.partialRecord(z.enum(STORY_FIELDS), storyText).default({}),
  growthPlan: z.array(z.string().max(500)).max(STORY_ROWS).default([]),
  ramadanGoals: z.array(z.string().max(500)).max(STORY_ROWS).default([]),
});
export type Story = z.infer<typeof storySchema>;
