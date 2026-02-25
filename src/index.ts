import express from "express";
import cors from "cors";
import { attestationsRouter } from "./routes/attestations.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { analyticsRouter } from './routes/analytics.js'
import businessRoutes from './routes/businesses.js'

export const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter)
app.use('/api/attestations', attestationsRouter)
app.use('/api/businesses', businessRoutes)
app.use('/api/analytics', analyticsRouter)

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Veritasor API listening on http://localhost:${PORT}`);
  });
}
