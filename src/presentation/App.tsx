import { MockJaneRepository } from '../infrastructure/mockJane';
import { headlineLoader } from './headline/headlineProvider';
import { DashboardShell } from './shell/DashboardShell';
import type { DashboardProvider } from './shell/provider';

const jane = new MockJaneRepository();

const provider: DashboardProvider = {
  'headline-metrics': headlineLoader({ bookings: jane, inquiries: jane }),
};

export function App() {
  return <DashboardShell provider={provider} />;
}
