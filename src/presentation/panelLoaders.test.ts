import { afterEach, describe, expect, it, vi } from 'vitest';
import { permittedPanels } from '../application/access';
import { PANEL_IDS, ROLES } from '../domain';
import { gateProvider } from './access/gateProvider';
import { createPanelLoaders } from './panelLoaders';
import { serverFetcher } from './testFetcher';

afterEach(() => vi.unstubAllGlobals());

function stubFetch() {
  const direct = serverFetcher();
  const fetchMock = vi.fn(async (url: string) => {
    const id = url.replace('/api/panels/', '') as (typeof PANEL_IDS)[number];
    return { ok: true, status: 200, json: async () => direct(id) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('createPanelLoaders', () => {
  it('provides a loader for every panel id', async () => {
    const loaders = createPanelLoaders(serverFetcher());
    expect(Object.keys(loaders).sort()).toEqual([...PANEL_IDS].sort());
    for (const id of PANEL_IDS) expect((await loaders[id]()).items).toBeDefined();
  });

  it('fetches /api/panels/<id> and maps the endpoint JSON to the view model', async () => {
    const fetchMock = stubFetch();
    const vm = await createPanelLoaders()['intake-funnel']();
    expect(fetchMock).toHaveBeenCalledWith('/api/panels/intake-funnel');
    expect(vm.items.length).toBeGreaterThan(0);
    expect(vm.render).toBeTypeOf('function');
  });

  it('rejects when the endpoint responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    await expect(createPanelLoaders()['lead-sources']()).rejects.toThrow(/500/);
  });

  it('issues no request for panels the role may not view', async () => {
    for (const role of ROLES) {
      const fetchMock = stubFetch();
      const gated = gateProvider(createPanelLoaders(), role);
      expect(Object.keys(gated).sort()).toEqual([...permittedPanels(role)].sort());
      expect(fetchMock).not.toHaveBeenCalled();
      for (const id of Object.keys(gated) as (keyof typeof gated)[]) await gated[id]!();
      expect(fetchMock).toHaveBeenCalledTimes(permittedPanels(role).length);
    }
  });
});
