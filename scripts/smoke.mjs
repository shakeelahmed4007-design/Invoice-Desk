import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('..', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'desk-live-'));
const env = { ...process.env, DATABASE_PATH: temp + '/invoices.db' };
let child;
async function start() {
  child = spawn('npm', ['run', 'dev'], { cwd, env, detached: true, stdio: 'pipe' });
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
  for (let n = 0; n < 100; n++) {
    try {
      if ((await fetch('http://localhost:5173/api/health')).ok) return;
    } catch {
      /* Wait until the proxy and API are ready. */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error('start timeout');
}
async function stop() {
  if (child && child.exitCode === null) {
    const stopped = new Promise((r) => child.on('exit', r));
    process.kill(-child.pid, 'SIGTERM');
    await stopped;
  }
}
try {
  await start();
  assert.match(await (await fetch('http://localhost:5173')).text(), /Invoice Desk/);
  assert.equal(
    (await (await fetch('http://localhost:3001/api/invoices')).json()).invoices.length,
    6,
  );
  let r = await fetch('http://localhost:5173/api/invoices/1/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved', note: 'Real process restart test' }),
  });
  assert.equal(r.status, 200);
  await stop();
  await start();
  const invoice = await (await fetch('http://localhost:5173/api/invoices/1')).json();
  assert.equal(invoice.status, 'approved');
  assert.equal(invoice.decision_note, 'Real process restart test');
  assert.equal(
    (await (await fetch('http://localhost:3001/api/invoices')).json()).invoices.length,
    6,
  );
  console.log(
    'PASS: npm run dev, UI HTML, direct API, Vite proxy, PATCH, full process restart, durable status/note, no reseeding',
  );
} finally {
  await stop();
  await rm(temp, { recursive: true, force: true });
}
