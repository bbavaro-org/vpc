import { useMemo, useState } from 'react';
import { DEFAULT_ROLE } from '../application/access';
import type { Role } from '../domain';
import { InMemoryAuditLog } from '../infrastructure/inMemoryAuditLog';
import { gateProvider } from './access/gateProvider';
import { createPanelLoaders } from './panelLoaders';
import { DashboardShell } from './shell/DashboardShell';

const auditLog = new InMemoryAuditLog();

const loaders = createPanelLoaders();

export function App() {
  const [role, setRole] = useState<Role>(DEFAULT_ROLE);
  const provider = useMemo(() => gateProvider(loaders, role, { log: auditLog }), [role]);
  return <DashboardShell provider={provider} role={role} onRoleChange={setRole} auditLog={auditLog} />;
}
