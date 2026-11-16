import { MockJaneRepository } from '../infrastructure/mockJane';
import { REFERENCE_NOW } from '../domain/referenceNow';
import { capacityLoader } from './capacity/capacityProvider';
import { funnelLoader } from './funnel/funnelProvider';
import { headlineLoader } from './headline/headlineProvider';
import { DashboardShell } from './shell/DashboardShell';
import type { DashboardProvider } from './shell/provider';

const jane = new MockJaneRepository();

const provider: DashboardProvider = {
  'headline-metrics': headlineLoader({ bookings: jane, inquiries: jane }),
  'intake-funnel': funnelLoader(jane, REFERENCE_NOW),
  'clinician-capacity': capacityLoader(jane, REFERENCE_NOW),
};

export function App() {
  return <DashboardShell provider={provider} />;
}
