# KoinX Reconciliation Engine

A transaction reconciliation engine that ingests crypto transaction data from two sources (user and exchange), matches them, and produces a structured reconciliation report.

## Setup

### Prerequisites
- Node.js v18+
- Docker (for MongoDB)

### Steps

1. Clone the repository
```bash
   git clone 
   cd koinx-reconciliation
```

2. Install dependencies
```bash
   npm install
```

3. Create a `.env` file in the root
```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/koinx_reconciliation
   TIMESTAMP_TOLERANCE_SECONDS=300
   QUANTITY_TOLERANCE_PCT=0.01
```

4. Start MongoDB
```bash
   docker-compose up -d
```

5. Add the two CSV files inside the `data/` folder
data/user_transactions.csv
data/exchange_transactions.csv

6. Start the server
```bash
   npm run dev
```

### Get full report
GET /report/:runId

### Get summary counts
GET /report/:runId/summary

### Get unmatched rows only
GET /report/:runId/unmatched

A CSV report is also saved locally to `reports/<runId>.csv` after each run.

For a quick demo, see `sample-report.csv` in the repo root.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `TIMESTAMP_TOLERANCE_SECONDS` | 300 | Max seconds difference between timestamps to consider a match |
| `QUANTITY_TOLERANCE_PCT` | 0.01 | Max percentage difference in quantity to consider a match |

## Key Design Decisions

**Flagging over dropping** — Bad rows (invalid timestamp, negative quantity, missing fields, duplicate IDs) are never dropped. They are saved to the database with `isFlagged: true` and a `flagReasons` array explaining every issue found.

**Asset normalisation** — Asset names are normalised at ingestion time using a configurable alias map (e.g. `bitcoin` → `BTC`). Adding new aliases requires no code changes, only an update to `src/config/assetAliases.ts`.

**TRANSFER_IN / TRANSFER_OUT** — The same transfer transaction appears as `TRANSFER_OUT` on the user side and `TRANSFER_IN` on the exchange side. The engine treats these as equivalent types during matching.

**Best match by proximity** — When multiple exchange transactions are candidates for a user transaction, the engine picks the one with the closest timestamp. This avoids arbitrary matching when multiple similar transactions exist.

**Conflicting vs Unmatched** — A transaction is marked conflicting (not unmatched) when a match is found by asset, type, and timestamp but the quantity difference exceeds tolerance. This distinction helps identify data quality issues vs genuinely missing transactions.

**Async reconciliation** — `POST /reconcile` returns a `runId` immediately with status `processing`. The actual reconciliation runs after the response is sent. This keeps the API responsive for large datasets.