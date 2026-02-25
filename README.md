# Veritasor Backend

API gateway and attestation service for Veritasor. Handles revenue data normalization, Merkle proof generation, and on-chain submission to Soroban contracts (integration points are stubbed for the initial version).

## Tech Stack

- **Node.js** + **TypeScript**
- **Express** for HTTP API
- Planned: PostgreSQL, Redis, gRPC internal services

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

```bash
# Install dependencies
npm install

# Run in development (watch mode)
npm run dev
```

API runs at `http://localhost:3000`. Use `PORT` env var to override.

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start with tsx watch           |
| `npm run build`| Compile TypeScript to `dist/`  |
| `npm run start`| Run compiled `dist/index.js`   |
| `npm run lint` | Run ESLint                     |

## API (current)

| Method | Path                   | Description              |
|--------|------------------------|--------------------------|
| GET    | `/api/health`           | Health check             |
| GET    | `/api/attestations`     | List attestations (stub) |
| POST   | `/api/attestations`     | Submit attestation (stub)|
| GET    | `/api/analytics/periods`| List attested periods for current business (protected) |

## Project structure

```
veritasor-backend/
├── src/
│   ├── routes/       # health, attestations
│   └── index.ts      # Express app entry
├── package.json
└── tsconfig.json
```

## Environment

Optional `.env`:

```
PORT=3000
```

## Merging to remote

This directory is its own git repository. To push to your remote:

```bash
git remote add origin <your-backend-repo-url>
git push -u origin main
```
