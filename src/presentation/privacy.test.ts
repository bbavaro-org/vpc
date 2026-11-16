import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { permittedPanels } from '../application/access';
import { ROLES } from '../domain';
import { MockAutomationRepository } from '../infrastructure/mockAutomation';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { createPanelLoaders } from './panelLoaders';

const ROW_ID = /\b(ap|iq|cl|wl)-\d+/;
const ISO_TIMESTAMP = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const PERSONAL_LABEL = /name|note|diagnos/i;

// AC-2: no personal or clinical data reaches any panel in any role.
describe('aggregates-only boundary across roles', () => {
  const loaders = createPanelLoaders({ jane: new MockJaneRepository(), automation: new MockAutomationRepository() });

  for (const role of ROLES) {
    for (const panel of permittedPanels(role)) {
      it(`${role} / ${panel} exposes no row ids, timestamps, or personal labels`, async () => {
        const vm = await loaders[panel]();
        const rendered = vm.render ? renderToString(vm.render() as never) : '';
        for (const text of [JSON.stringify(vm.items), rendered]) {
          expect(text).not.toMatch(ROW_ID);
          expect(text).not.toMatch(ISO_TIMESTAMP);
        }
        for (const item of vm.items) expect(item.label).not.toMatch(PERSONAL_LABEL);
      });
    }
  }
});
