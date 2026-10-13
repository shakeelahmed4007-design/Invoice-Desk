# Mini Invoice Approval Desk

A local, full-stack accounts-payable inbox for reviewing invoices, comparing possible duplicates, and recording final approval or rejection decisions. Includes a React interface, a typed Express API, a persistent SQLite database, and automated API and browser checks. No external services, accounts, API keys, or remote fonts are used at runtime.

## What is new in v2

- Redesigned navy/indigo workspace with financial summaries and a workflow breakdown.
- **Add invoice** modal with live preview, exact-cent amount conversion, calendar validation, review preferences, and unsaved-change confirmation.
- **Edit pending invoices** from the detail drawer; final decisions remain immutable.
- Search by vendor, invoice number or description; currency, duplicate, overdue and final-status filters; due-date/amount sorting; six-row pagination.
- CSV export of all rows matching the active tab and filters, with quoted fields and spreadsheet formula protection.
- Decision history with timestamps and notes, plus recent-decision shortcuts.
- Overdue badges and pending-value summaries. Totals use one explicitly labeled currency (USD when all currencies are shown); no exchange rates or mixed-currency sums.

## Stack

- **API:** Node.js, TypeScript (strict), Express 4, Zod 3, better-sqlite3.
- **UI:** React 18.3, JSX, Vite 6, Tailwind CSS 3, Lucide icons.
- **Quality:** ESLint, Vitest, Supertest, Playwright.
- **Monorepo:** npm workspaces with a single lockfile; concurrently starts both apps.

## Quick start

Use **Node.js 22.12+** (tested with Node 24.19) and npm 10+.

```bash
cd invoice-approval-desk
npm install
npm run dev
```

Open **http://localhost:5173**. The API listens on **http://localhost:3001**. Vite proxies `/api` requests to Express. SQLite is created automatically at `server/data/invoices.db`, with six records seeded once. Stopping or restarting the app never resets decisions.

`better-sqlite3` is a native module. Standard supported platforms use prebuilt binaries; if a prebuilt binary is unavailable, installation requires a C++ compiler, Python, and the platform's Node build tools. Dependency installation requires internet access; the running application does not.

### Configuration

Defaults work without an environment file. For overrides, copy `.env.example` to `.env` in the repository root. Both Vite and the server read this root file.

| Variable        | Default                 | Meaning                                     |
| --------------- | ----------------------- | ------------------------------------------- |
| `PORT`          | `3001`                  | Express port and Vite proxy target          |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin                         |
| `DATABASE_PATH` | `./data/invoices.db`    | Absolute path or path relative to `server/` |

Vite uses port 5173 with `strictPort` to avoid silently changing its origin. Restart development processes after editing `.env`.

### Production build

```bash
npm run build
npm start
```

Open **http://localhost:3001**. Express serves the compiled API and the built client from one origin. `npm start` requires the build first. Keep the database directory on a persistent writable disk. The supplied application is intended for a trusted local workstation; it has no authentication or tenant isolation and should not be exposed to the public internet unchanged.

### Checks

```bash
npm run check          # lint, strict server typecheck, 47 API/UI tests, builds
npm test               # 44 API/repository + 3 React interaction tests
npm run test:smoke     # real dev processes + HTTP + restart (POSIX, ports 3001/5173 free)
npm run build
npx playwright install chromium
npm run test:e2e       # real browser + child API process + disk DB restart
```

The E2E script uses port 3107 and a temporary database, verifies decisions through the UI, restarts the API, and checks that decisions persist. It also checks duplicate comparison, rejection cancellation, mobile overflow, keyboard tabs, and error recovery. It removes its temporary database and shuts down its child processes. Set `CHROMIUM_PATH` to use an existing Chromium executable. On minimal Linux installations, Playwright may require `npx playwright install --with-deps chromium`.

## Folder structure

```text
invoice-approval-desk/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── api/useInvoices.js
│       ├── components/
│       │   ├── InvoiceForm.jsx
│       │   ├── InvoiceDrawer.jsx
│       │   ├── InvoiceTable.jsx
│       │   ├── StatusBadge.jsx
│       │   ├── Tabs.jsx
│       │   └── Toast.jsx
│       ├── App.jsx
│       ├── App.test.jsx
│       ├── utils.js
│       ├── format.js
│       ├── main.jsx
│       └── styles.css
├── server/
│   ├── src/
│   │   ├── app.ts
│   │   ├── database.ts
│   │   ├── errors.ts
│   │   ├── index.ts
│   │   ├── repository.ts
│   │   ├── routes.ts
│   │   ├── seed.ts
│   │   ├── types.ts
│   │   └── validation.ts
│   ├── test/invoices.test.ts
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── SCHEMA.md
│   └── VERIFICATION.md
├── scripts/
│   ├── e2e.mjs
│   └── smoke.mjs
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── eslint.config.mjs
├── package-lock.json
├── package.json
└── README.md
```

`server/data/` and workspace `dist/` directories are generated at runtime/build time and intentionally excluded from the source ZIP and version control.

## API reference

All API responses are JSON. Amounts are **integer cents**, date-only fields are `YYYY-MM-DD`, and timestamps use ISO 8601 UTC. Lists are ordered by `created_at DESC, id DESC` for deterministic ties. POST creates invoices and PATCH edits pending records, with duplicate detection on both paths. No deletion endpoint is exposed so decision evidence is retained.

| Method | Endpoint                          | Success | Behavior                                                                      |
| ------ | --------------------------------- | ------- | ----------------------------------------------------------------------------- |
| GET    | `/api/health`                     | 200     | Checks database connectivity                                                  |
| GET    | `/api/invoices`                   | 200     | Returns all invoices                                                          |
| GET    | `/api/invoices?status=processing` | 200     | Filters by `processing`, `needs_review`, `approved`, `rejected`, or `decided` |
| GET    | `/api/invoices/:id`               | 200     | Invoice details, including `original_invoice` or `null`                       |
| PATCH  | `/api/invoices/:id/status`        | 200     | Makes a final `approved` or `rejected` decision                               |

### Create and edit

```bash
curl -X POST http://localhost:3001/api/invoices \
  -H 'Content-Type: application/json' \
  -d '{"invoice_number":"INV-2001","vendor_name":"Acme Studio","amount":123456,"currency":"USD","invoice_date":"2026-10-01","due_date":"2026-10-31","description":"Brand design project","status":"processing"}'
```

Returns **201**, the complete detail object, and a `Location: /api/invoices/{id}` header. Duplicate submissions are saved as `needs_review` with an original-invoice reference. The supported two-decimal currencies are USD, EUR, GBP, CAD, AUD, PKR and AED. Amount must be integer cents from 1 through 99,999,999,999. Due date cannot precede invoice date. Unknown fields and invalid calendar dates return 400.

Use `PATCH /api/invoices/:id` with the same full editable payload to update a pending invoice; it returns 200 and the updated details. This is a full-form update, not a sparse patch. Optional `flag_reason` accepts up to 500 characters; omitted `status` defaults to processing. The server always recomputes duplicates, ignoring the current record and only matching original (nonduplicate) records to prevent cycles.

Approved/rejected records return 409 on edit. If an invoice is referenced as the original by another record, its vendor, invoice number, amount and currency cannot be changed (409); dates, description and review preferences remain editable. This preserves duplicate evidence. Editing a duplicate into a unique invoice clears its automatic duplicate link and reason.

### Health

```bash
curl http://localhost:3001/api/health
```

```json
{ "status": "ok" }
```

### List

```bash
curl 'http://localhost:3001/api/invoices?status=processing'
curl 'http://localhost:3001/api/invoices?status=decided'
```

Response shape is `{ "invoices": [invoice, ...] }`. Each item contains all stored fields, as shown in the detail example below, except the nested `original_invoice` property. An empty result is `{ "invoices": [] }`. `decided` combines approved and rejected invoices.

### Detail

```bash
curl http://localhost:3001/api/invoices/1
curl http://localhost:3001/api/invoices/4
```

Example response for record 1 before a decision (timestamps reflect when your database was seeded):

```json
{
  "id": 1,
  "invoice_number": "INV-1042",
  "vendor_name": "Linear Studio",
  "amount": 245000,
  "currency": "USD",
  "invoice_date": "2026-10-01",
  "due_date": "2026-10-31",
  "description": "Product design retainer — October",
  "status": "processing",
  "duplicate_of_id": null,
  "flag_reason": null,
  "created_at": "2026-10-13T12:00:00.000Z",
  "updated_at": "2026-10-13T12:00:00.000Z",
  "decided_at": null,
  "decision_note": null,
  "original_invoice": null
}
```

Record 4 has `duplicate_of_id: 1`, `flag_reason: "Possible duplicate of INV-1042"`, and the full stored record 1 as `original_invoice`. The nested record is nonrecursive.

### Decide

```bash
curl -X PATCH http://localhost:3001/api/invoices/1/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"approved","note":"Matched to the purchase order."}'

curl -X PATCH http://localhost:3001/api/invoices/4/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"rejected","note":"Duplicate submission."}'
```

Returns the complete updated detail object with the requested status, UTC `decided_at` and `updated_at`, and trimmed `decision_note`. Blank or omitted notes are stored as `null`. Notes have a 2,000-character limit. Unknown body keys are rejected. These examples change your local records; running the first one again produces a conflict.

### Errors

- **400:** Invalid filter, invalid JSON, unsupported status, non-string/overlong note, or unknown request fields.
- **404:** Missing invoice, malformed/nonpositive/unsafe integer ID, or unknown route.
- **409:** Invoice is already approved or rejected; its original decision remains intact.
- **413:** Request body exceeds 16 KB.
- **500:** Unexpected server/database failure; internals are logged on the server and not returned.

```json
{
  "error": {
    "message": "Validation failed.",
    "issues": [{ "field": "note", "message": "Note must be 2,000 characters or fewer." }]
  }
}
```

```json
{ "error": { "message": "Invoice not found." } }
```

```json
{
  "error": {
    "message": "This invoice has already been decided. Only processing or needs_review invoices can be approved or rejected."
  }
}
```

For a syntactically valid but nonexistent numeric ID, body validation occurs before repository lookup on PATCH; a valid body returns 404.

## Design decisions and trade-offs

- **Integer money:** No floating-point arithmetic for stored amounts. `Intl.NumberFormat` converts cents for display. The assignment's two-decimal cents convention applies; a broader multi-currency system would need per-currency minor-unit metadata.
- **Atomic decisions:** An immediate SQLite transaction and a conditional UPDATE enforce one final decision. Competing requests cannot both overwrite a decision. Database CHECK constraints guard status values and decision timestamps.
- **Local persistence:** WAL mode, foreign keys, and a busy timeout support a small local desk. SQLite's synchronous API keeps transaction boundaries simple; a high-throughput service would need different concurrency characteristics.
- **First-run seed marker:** A metadata key written in the same transaction as all six inserts prevents reseeding after decisions or later data changes. Duplicate record 4 is detected by the same code used for future inserts, not hardcoded foreign-key assignment.
- **Conservative duplicate matching:** Case-insensitive outer-trimmed vendor + invoice number + exact cents match the requested business key. A duplicate is flagged and moved into review rather than blocked or automatically rejected. Currency is deliberately not added to the assignment's matching key; see schema notes.
- **Filtering and export:** Filtering, sorting and pagination operate on the loaded local inbox. Amount sorting compares nominal amounts without FX conversion; select a currency for meaningful comparisons. CSV exports the full filtered result, not just the visible page.
- **UI consistency:** Load the small inbox once and compute all tab counts from the same response. After a successful PATCH, use its authoritative response to update the list and select the decided tab. Nothing is saved in browser storage. Refresh retrieves other clients' changes; there is no polling.
- **Accessible interactions:** Semantic table, labeled row buttons, arrow/Home/End tab navigation, focus-trapped modal, Escape close, restored focus, inert background, visible focus indicators, live loading/error/toast messages, and explicit rejection confirmation. The table scrolls within its container on narrow screens; the page itself does not overflow.
- **Small typed layers:** Routes validate input, the repository owns SQL/business transitions, and the app factory permits isolated tests. The frontend intentionally remains plain JSX per the assignment.
- **No pretend functionality:** No fake user, upload action, authentication, external integration, or unsaved browser-only decisions. The original invoice comparison is a real API-backed preview.

## What I would improve with more time

1. Identity, roles, CSRF protection where applicable, and an append-only actor-attributed audit log before multi-user deployment.
2. Versioned migrations, backup/restore procedures, and database upgrade tests for evolving schemas.
3. Server-side cursor pagination, indexed search, server-side counts, and query caching for large inboxes.
4. A validated import workflow, richer duplicate normalization, cross-currency policy, and human-reviewed duplicate resolution.
5. Automated accessibility auditing, broader browser/screen-reader coverage, and CI across supported Node/platform combinations.
6. Structured logging, operational metrics, and deployment-specific request limits.
