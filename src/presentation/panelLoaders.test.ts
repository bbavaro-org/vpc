import { describe, expect, it } from 'vitest';
import { PANEL_IDS } from '../domain';
import { MockAutomationRepository } from '../infrastructure/mockAutomation';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { createPanelLoaders } from './panelLoaders';

describe('createPanelLoaders', () => {
  it('provides a loader for every panel id', async () => {
    const loaders = createPanelLoaders({ jane: new MockJaneRepository(), automation: new MockAutomationRepository() });
    expect(Object.keys(loaders).sort()).toEqual([...PANEL_IDS].sort());
    for (const id of PANEL_IDS) expect((await loaders[id]()).items).toBeDefined();
  });
});
