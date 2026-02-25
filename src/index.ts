import express from "express";
import cors from "cors";
import { attestationsRouter } from "./routes/attestations.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { analyticsRouter } from './routes/analytics.js'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import {
  apiVersionMiddleware,
  versionResponseMiddleware,
} from './middleware/apiVersion.js'
import businessRoutes from './routes/businesses.js'

export const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(apiVersionMiddleware)
app.use(versionResponseMiddleware)
app.use(cors());
app.use(express.json());

app.use('/api/v1/health', healthRouter)
app.use('/api/v1/attestations', attestationsRouter)
app.use('/api/v1/businesses', businessRoutes)
app.use('/api/v1/analytics', analyticsRouter)

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Veritasor API listening on http://localhost:${PORT}`);
  });
}
