# Verification report

Verified on 2026-10-13 with Node.js 24.19.0, npm 11.9.0, and Linux.

| Check                              | Result                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `npm install`                      | Passed; all workspace dependencies installed                            |
| `npm run dev`                      | Passed; concurrently starts Express and Vite                            |
| Direct API and Vite proxy requests | Passed; health, list, PATCH, detail                                     |
| Real dev process stop/start        | Passed; approved status and note persisted, six records remained        |
| ESLint                             | Passed with no errors or warnings                                       |
| Strict server TypeScript check     | Passed                                                                  |
| Vitest + Supertest                 | 44 backend tests passed                                                 |
| React Testing Library + jsdom      | 3 UI interaction tests passed                                           |
| Production build                   | Passed for API and client                                               |
| Playwright / Chromium headless     | Passed against the real built application and a temporary file database |

The v2 browser workflow verified:

- Approving an invoice with a note and automatic navigation to the decided tab.
- Reloading the page and seeing the persisted note and disabled decision buttons.
- Comparing a duplicate to its original invoice.
- Cancelling rejection without changing its status, then confirming rejection.
- Stopping and restarting the API process and verifying the stored approval and note.
- Mobile layout at 390 × 844 with no document-level horizontal overflow.
- Drawer opening and Escape dismissal, and keyboard tab navigation.
- Simulated list-request failure followed by successful retry.
- Creating a new invoice through the form, with the exact cent amount persisted.
- Editing a pending invoice and retaining its changed amount after a server restart.
- Creating a real duplicate through the form and automatically moving it to review.
- Searching, clearing empty search results, filtering duplicates, and downloading CSV.
- Opening and closing the create form on a mobile viewport without page overflow.
- No uncaught browser JavaScript errors during the workflow.

The React tests additionally cover detail-load failure/retry and focus recovery. Screenshots were inspected during implementation. An out-of-flow screen-reader label initially caused mobile overflow, and removing an error retry button initially lost focus; both were corrected and the relevant checks rerun successfully.

Tests use isolated in-memory or temporary on-disk databases. The deliverable excludes generated databases, dependencies, browser binaries, and build output, so its first run starts with the original six sample invoices. Browser testing uses an installed Playwright Chromium headless shell; browser installation is needed only to rerun `test:e2e`, not to run the app.

Scope: automated checks and visual inspection do not constitute a complete security or accessibility audit. No external services or production deployment were involved.

## v2 API coverage

Added 17 tests for creation, Location headers, duplicate matching, amount/currency/calendar-date validation, editing and duplicate recomputation, terminal-state edit conflicts, 404s, and original-invoice identity protection. Existing databases remain compatible; no destructive schema change or seed reset is required. All 47 API and React tests, strict types, lint, production build, and the expanded real-browser flow passed.
