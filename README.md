# pgraph-demo

A full-stack demo for the [pgraph](https://github.com/ritamzico/pgraph) probabilistic graph inference engine. The frontend is a React SPA that lets you load, visualize, and query probabilistic graphs interactively. The backend is a Go HTTP server that wraps the pgraph engine and exposes a single `/query` endpoint.

## Structure

```
backend/   Go server (pgraph inference engine API) — deployed to GCP Cloud Run
frontend/  React visualizer — deployed to Vercel
```

## Backend

**Stack:** Go, stdlib `net/http`, [`github.com/ritamzico/pgraph`](https://github.com/ritamzico/pgraph)

```bash
cd backend
go run ./cmd/server          # listens on :8080
go run ./cmd/server -port N  # custom port
```

### API

`POST /query`

```json
{
  "graph": { ... },
  "dsl": "FIND path FROM a TO b"
}
```

Response is either a read result or, for mutations (CREATE/DELETE), the updated graph serialized back as `{ "kind": "mutation", "data": { ... } }`.

## Frontend

**Stack:** React 19, TypeScript, Tailwind v4, Vite, Bun

```bash
cd frontend
bun install
VITE_API_ENDPOINT=http://localhost:8080 bun dev
```

## Deployment

- **Backend:** automatically deployed to GCP Cloud Run on push to `main` when files under `backend/` change (see [`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml)).
- **Frontend:** deployed to Vercel.
