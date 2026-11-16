import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PANEL_IDS } from '../domain';
import { createServer } from './aggregateServer';

let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const ROW_ID = /(ap|iq|cl|wl)-\d{5}/;
const ISO_TS = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

describe('aggregate API server', () => {
  it('GET /api/panels/intake-funnel returns the funnel aggregate and no raw row id', async () => {
    const res = await fetch(`${base}/api/panels/intake-funnel`);
    expect(res.status).toBe(200);
    const body = await res.text();
    const json = JSON.parse(body);
    expect(json.items.length).toBeGreaterThan(0);
    expect(json.data.stages.length).toBeGreaterThan(0);
    expect(body).not.toMatch(ROW_ID);
  });

  it.each(PANEL_IDS)('serves %s as aggregate-only JSON', async (id) => {
    const res = await fetch(`${base}/api/panels/${id}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.text();
    const json = JSON.parse(body);
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.data).toBeDefined();
    expect(body).not.toMatch(ROW_ID);
    expect(body).not.toMatch(ISO_TS);
  });

  it('returns 404 for an unknown panel id', async () => {
    const res = await fetch(`${base}/api/panels/nope`);
    expect(res.status).toBe(404);
  });

  it('does not expose an audit endpoint', async () => {
    const res = await fetch(`${base}/api/audit`);
    expect(res.status).toBe(404);
  });

  it('does not serve files outside dist for traversal paths', async () => {
    const res = await fetch(`${base}/..%2fpackage.json`);
    expect(await res.text()).not.toContain('vancouver-psychology-centre-dashboard');
  });
});
