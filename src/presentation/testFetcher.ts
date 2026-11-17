import { REFERENCE_NOW } from '../domain/referenceNow';
import { MockAutomationRepository } from '../infrastructure/mockAutomation';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { buildPanels, type PanelRepos } from '../server/aggregateServer';
import type { PanelFetcher, PanelPayload } from './panelApi';

/** Test-only: serves the server's aggregate JSON in-process, round-tripped through JSON like the wire. */
export function serverFetcher(
  repos: PanelRepos = { jane: new MockJaneRepository(), automation: new MockAutomationRepository() },
): PanelFetcher {
  const panels = buildPanels(REFERENCE_NOW, repos);
  return (async (id) => JSON.parse(JSON.stringify(await panels[id]())) as PanelPayload) as PanelFetcher;
}
