import express from 'express'
import cors from 'cors'
import { attestationsRouter } from './routes/attestations.js'
import { analyticsRouter } from './routes/analytics.js'
import { healthRouter } from './routes/health.js'
import { errorHandler } from './middleware/errorHandler.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/attestations', attestationsRouter)
app.use('/api/analytics', analyticsRouter)

// Global error handler — must be last middleware registered.
app.use(errorHandler)
