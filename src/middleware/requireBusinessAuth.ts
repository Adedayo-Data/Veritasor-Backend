import type { RequestHandler } from 'express'

const parseBusinessId = (authorization?: string, businessIdHeader?: string): string | null => {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null
  }

  const businessId = businessIdHeader?.trim()
  return businessId ? businessId : null
}

export const requireBusinessAuth: RequestHandler = (req, res, next) => {
  const businessId = parseBusinessId(req.header('authorization'), req.header('x-business-id'))
  if (!businessId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token and x-business-id header are required',
    })
    return
  }

  res.locals.businessId = businessId
  next()
}
