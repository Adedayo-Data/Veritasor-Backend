import type { Request, Response, NextFunction } from 'express'

/**
 * Require authentication: returns 401 if no valid auth is present.
 * Sets res.locals.userId when present (e.g. for idempotency key scoping).
 * Accepts any non-empty Authorization header for now; replace with real auth (JWT, etc.) later.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : undefined

  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization' })
    return
  }

  ;(res as Response & { locals: { userId?: string } }).locals.userId = token
  next()
}
