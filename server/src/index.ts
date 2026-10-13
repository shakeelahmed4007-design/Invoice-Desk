import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { z } from 'zod';
import { openDatabase } from './database.js';
import { seedDatabase } from './seed.js';
import { createApp } from './app.js';
const serverRoot = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: resolve(serverRoot, '../.env') });
const config = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
    DATABASE_PATH: z.string().min(1).default('./data/invoices.db'),
  })
  .parse(process.env);
const db = openDatabase(resolve(serverRoot, config.DATABASE_PATH));
seedDatabase(db);
const app = createApp(db, config.CLIENT_ORIGIN, resolve(serverRoot, '../client/dist'));
const server = app.listen(config.PORT, () =>
  console.log(`Invoice API listening on http://localhost:${config.PORT}`),
);
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
