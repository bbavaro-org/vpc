import { createServer as createHttpServer, type Server, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { getBookedPercentBySpecialty, getWaitlist } from '../application/capacity';
import { getAutomationImpact } from '../application/automation';
import { getIntakeFunnel } from '../application/funnel';
import { getHeadlineMetrics } from '../application/headline';
import { getLeadSourceShares } from '../application/leadSources';
import { PANEL_IDS, type PanelId } from '../domain';
import { REFERENCE_NOW } from '../domain/referenceNow';
import { MockAutomationRepository } from '../infrastructure/mockAutomation';
import { MockJaneRepository } from '../infrastructure/mockJane';

interface PanelItem {
  readonly label: string;
  readonly value: string;
}

/** Aggregate-only panel payload: summary items plus the use case's aggregate view model. */
interface PanelPayload {
  readonly items: readonly PanelItem[];
  readonly data: unknown;
}

const MIME: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};

function buildPanels(now: Date): Readonly<Record<PanelId, () => Promise<PanelPayload>>> {
  const jane = new MockJaneRepository();
  const automation = new MockAutomationRepository();
  return {
    'headline-metrics': async () => {
      const metrics = await getHeadlineMetrics({ bookings: jane, inquiries: jane }, now);
      return {
        items: [{ label: 'New inquiries', value: String(metrics.newInquiries.current ?? 'No data') }],
        data: metrics,
      };
    },
    'intake-funnel': async () => {
      const funnel = await getIntakeFunnel(jane, now);
      return {
        items: funnel.total === 0 ? [] : funnel.stages.map((s) => ({ label: s.label, value: String(s.count) })),
        data: funnel,
      };
    },
    'lead-sources': async () => {
      const result = await getLeadSourceShares(jane, now);
      return {
        items:
          result.state === 'empty'
            ? []
            : result.shares.map((s) => ({ label: s.source, value: `${s.sharePercent}%` })),
        data: result,
      };
    },
    'clinician-capacity': async () => {
      const [bookings, waitlist] = await Promise.all([
        getBookedPercentBySpecialty(jane, now),
        getWaitlist(jane, now),
      ]);
      return {
        items: bookings.map((b) => ({
          label: b.specialty,
          value: b.state === 'no-capacity' ? 'No capacity' : `${b.bookedPercent}% booked`,
        })),
        data: { bookings, waitlist },
      };
    },
    'automation-impact': async () => {
      const impact = await getAutomationImpact(automation, now);
      return {
        items: [
          { label: 'Admin hours saved', value: String(impact.adminHoursSaved) },
          { label: 'Intake forms auto-filed', value: String(impact.intakeFormsAutoFiled) },
          { label: 'Reminders sent', value: String(impact.remindersSent) },
          { label: 'Sync errors', value: String(impact.syncErrors.count) },
        ],
        data: impact,
      };
    },
  };
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readFileOrNull(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path);
  } catch {
    return null;
  }
}

async function serveStatic(res: ServerResponse, distDir: string, urlPath: string): Promise<void> {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const root = resolve(distDir);
  const target = resolve(join(root, normalize(decoded)));
  const inside = target === root || target.startsWith(root + sep);
  const file = inside && extname(target) ? await readFileOrNull(target) : null;
  if (file) {
    res.writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' });
    res.end(file);
    return;
  }
  if (extname(decoded)) {
    res.writeHead(404).end();
    return;
  }
  const index = await readFileOrNull(join(root, 'index.html'));
  if (!index) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME['.html'] });
  res.end(index);
}

export function createServer(options: { now?: Date; distDir?: string } = {}): Server {
  const panels = buildPanels(options.now ?? REFERENCE_NOW);
  const distDir = options.distDir ?? resolve(process.cwd(), 'dist');
  return createHttpServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    const handle = async (): Promise<void> => {
      if (path.startsWith('/api/')) {
        const match = /^\/api\/panels\/([^/]+)$/.exec(path);
        const id = match?.[1];
        const load = id && (PANEL_IDS as readonly string[]).includes(id) ? panels[id as PanelId] : undefined;
        if (req.method !== 'GET' || !load) return sendJson(res, 404, { error: 'not found' });
        return sendJson(res, 200, await load());
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405).end();
        return;
      }
      await serveStatic(res, distDir, path);
    };
    handle().catch((err) => {
      console.error('request failed', err);
      if (!res.headersSent) sendJson(res, 500, { error: 'internal error' });
      else res.end();
    });
  });
}
