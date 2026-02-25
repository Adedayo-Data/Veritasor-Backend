import { Router } from 'express'
import { requireBusinessAuth } from '../middleware/requireBusinessAuth.js'
import { listAttestedPeriodsForBusiness } from '../services/analytics/periods.js'

export const analyticsRouter = Router()

analyticsRouter.get('/periods', requireBusinessAuth, (_req, res) => {
  const businessId = res.locals.businessId as string
  const periods = listAttestedPeriodsForBusiness(businessId)

  res.json({ periods })
})
