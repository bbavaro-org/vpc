import { MockAutomationRepository } from '../infrastructure/mockAutomation';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { createPanelLoaders } from './panelLoaders';
import { DashboardShell } from './shell/DashboardShell';
import type { DashboardProvider } from './shell/provider';

const provider: DashboardProvider = createPanelLoaders({
  jane: new MockJaneRepository(),
  automation: new MockAutomationRepository(),
});

export function App() {
  return <DashboardShell provider={provider} />;
}
