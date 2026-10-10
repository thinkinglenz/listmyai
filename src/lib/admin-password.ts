// The admin password, and the only way to reset it without a shell.
//
// It used to live solely in the ADMIN_PASSWORD environment variable, which
// meant the application could not change it: a "forgot password" link was
// impossible to build, and losing the value locked the owner out of their own
// panel until someone edited Vercel. It now lives hashed in the database, so
// a reset link emailed to the admin address can set a new one.
//
// The environment variable still works when no hash has been stored yet, so
// nothing breaks between deploying this and choosing a password.
//
// Hashing is scrypt from node:crypto. bcrypt and argon2 are better known but
// both are native dependencies, and scrypt is memory-hard, in the standard
// library, and entirely adequate for a single password.
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { safeEqual } from '@/lib/admin-auth'

const scryptAsync = promisify(scrypt) as (
  password: string, salt: string, keylen: number
) => Promise<Buffer>

/** How long a reset link stays valid. Long enough to find the email. */
export const RESET_TTL_MS = 30 * 60 * 1000
/** Refuse to send a second link while one this fresh is outstanding. */
const RESEND_COOLDOWN_MS = 2 * 60 * 1000

const KEYLEN = 64
export const MIN_PASSWORD_LENGTH = 10

function db() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex')

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scryptAsync(password, salt, KEYLEN)
  return `scrypt:${salt}:${derived.toString('hex')}`
}

async function matchesHash(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hex] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !hex) return false
  const derived = await scryptAsync(password, salt, KEYLEN)
  const expected = Buffer.from(hex, 'hex')
  if (expected.length !== derived.length) return false
  return timingSafeEqual(derived, expected)
}

interface Row {
  password_hash: string | null
  reset_hash: string | null
  reset_expires: string | null
}

async function readRow(): Promise<Row | null> {
  const supabase = db()
  if (!supabase) return null
  const { data } = await supabase
    .from('admin_auth')
    .select('password_hash, reset_hash, reset_expires')
    .eq('id', true)
    .maybeSingle()
  return (data as Row) ?? null
}

/**
 * True when `password` is the admin password.
 *
 * Falls back to ADMIN_PASSWORD while no hash is stored, so the first login
 * after this ships still works with whatever is in the environment.
 */
export async function verifyAdminPassword(password: unknown): Promise<boolean> {
  if (typeof password !== 'string' || !password) return false

  const row = await readRow()
  if (row?.password_hash) return matchesHash(password, row.password_hash)

  const fromEnv = process.env.ADMIN_PASSWORD
  return !!fromEnv && safeEqual(password, fromEnv)
}

/** True when a password can be checked at all, by either route. */
export async function adminPasswordConfigured(): Promise<boolean> {
  if (process.env.ADMIN_PASSWORD) return true
  const row = await readRow()
  return !!row?.password_hash
}

export async function setAdminPassword(password: string): Promise<boolean> {
  const supabase = db()
  if (!supabase) return false
  const { error } = await supabase
    .from('admin_auth')
    .update({
      password_hash: await hashPassword(password),
      // A used or superseded link must stop working immediately.
      reset_hash: null,
      reset_expires: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', true)
  if (error) console.warn('[admin-password] could not store the password:', error.message)
  return !error
}

/**
 * Start a reset. Returns the raw token for the emailed link, or null when one
 * was issued moments ago — resending on every click would let anyone with the
 * login page flood the admin inbox.
 */
export async function createResetToken(): Promise<string | null> {
  const supabase = db()
  if (!supabase) return null

  const row = await readRow()
  if (row?.reset_expires) {
    const issuedAt = new Date(row.reset_expires).getTime() - RESET_TTL_MS
    if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) return null
  }

  const token = randomBytes(32).toString('hex')
  const { error } = await supabase
    .from('admin_auth')
    .update({
      // Only the hash is stored: a leaked database row cannot be used to reset.
      reset_hash: sha256(token),
      reset_expires: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    })
    .eq('id', true)
  return error ? null : token
}

export type ResetResult = 'ok' | 'invalid' | 'expired' | 'weak' | 'failed'

/** Spend a reset token and set the new password. Tokens are single use. */
export async function consumeResetToken(token: unknown, password: unknown): Promise<ResetResult> {
  if (typeof token !== 'string' || !token) return 'invalid'
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) return 'weak'

  const row = await readRow()
  if (!row?.reset_hash || !row.reset_expires) return 'invalid'
  if (Date.now() > new Date(row.reset_expires).getTime()) return 'expired'

  const given = Buffer.from(sha256(token), 'hex')
  const stored = Buffer.from(row.reset_hash, 'hex')
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) return 'invalid'

  return (await setAdminPassword(password)) ? 'ok' : 'failed'
}
