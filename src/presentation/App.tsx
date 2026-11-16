import { MockAutomationRepository } from '../infrastructure/mockAutomation';
import { MockJaneRepository } from '../infrastructure/mockJane';
import { REFERENCE_NOW } from '../domain/referenceNow';
import { automationLoader } from './automation/automationProvider';
import { capacityLoader } from './capacity/capacityProvider';
import { funnelLoader } from './funnel/funnelProvider';
import { leadSourcesLoader } from './leadSources/leadSourcesProvider';
import { headlineLoader } from './headline/headlineProvider';
import { DashboardShell } from './shell/DashboardShell';
import type { DashboardProvider } from './shell/provider';

const jane = new MockJaneRepository();
const automation = new MockAutomationRepository();

const provider: DashboardProvider = {
  'headline-metrics': headlineLoader({ bookings: jane, inquiries: jane }),
  'intake-funnel': funnelLoader(jane, REFERENCE_NOW),
  'lead-sources': leadSourcesLoader(jane, REFERENCE_NOW),
  'clinician-capacity': capacityLoader(jane, REFERENCE_NOW),
  'automation-impact': automationLoader(automation),
};

export function App() {
  return <DashboardShell provider={provider} />;
}
