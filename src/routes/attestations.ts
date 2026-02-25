import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { idempotencyMiddleware } from '../middleware/idempotency.js'

export const attestationsRouter = Router()

attestationsRouter.use(requireAuth)

// Placeholder: list attestations (will integrate DB + Horizon later)
attestationsRouter.get('/', (_req, res) => {
  res.json({
    attestations: [],
    message: 'Attestation list will be populated from DB + Stellar',
  })
})

// Placeholder: get by id (will integrate DB later)
attestationsRouter.get('/:id', (req, res) => {
  res.json({
    id: req.params.id,
    message: 'Attestation detail will be loaded from DB + Stellar',
  })
})

// Placeholder: submit attestation (will call Merkle engine + Soroban later). Idempotent by Idempotency-Key.
attestationsRouter.post(
  '/',
  idempotencyMiddleware({
    scope: 'attestations',
    getUserKey: (_req, res) => (res.locals as { userId?: string }).userId ?? (res.req.ip ?? 'anonymous'),
  }),
  (req, res) => {
    res.status(201).json({
      message: 'Attestation submission will invoke Merkle generator and Soroban contract',
      business_id: req.body?.business_id ?? null,
      period: req.body?.period ?? null,
    })
  }
)

// Placeholder: revoke attestation (will integrate Soroban later)
attestationsRouter.delete('/:id', (req, res) => {
  res.status(200).json({
    id: req.params.id,
    message: 'Attestation revoke will invoke Soroban contract',
  })
})
