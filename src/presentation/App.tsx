import { useMemo, useState } from 'react';
import { DEFAULT_ROLE } from '../application/access';
import type { Role } from '../domain';
import { MockAutomationRepository } from '../infrastructure/mockAutomation';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { gateProvider } from './access/gateProvider';
import { createPanelLoaders } from './panelLoaders';
import { DashboardShell } from './shell/DashboardShell';

const loaders = createPanelLoaders({
  jane: new MockJaneRepository(),
  automation: new MockAutomationRepository(),
});

export function App() {
  const [role, setRole] = useState<Role>(DEFAULT_ROLE);
  const provider = useMemo(() => gateProvider(loaders, role), [role]);
  return <DashboardShell provider={provider} role={role} onRoleChange={setRole} />;
}
