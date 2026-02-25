/**
 * App config from environment. Extend as needed.
 */

const isProduction = process.env.NODE_ENV === 'production'

/**
 * CORS allowed origins.
 * - Dev: * (allow all) unless ALLOWED_ORIGINS is set.
 * - Production: ALLOWED_ORIGINS (comma-separated), or [] if unset (strict).
 */
function getAllowedOrigins(): string | string[] {
  const raw = process.env.ALLOWED_ORIGINS
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
  if (isProduction) {
    return []
  }
  return '*'
}

export const config = {
  cors: {
    origin: getAllowedOrigins(),
  },
} as const
