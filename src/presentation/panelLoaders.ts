import type { AutomationRepository, BookingRepository, InquiryRepository, PanelId } from '../domain';
import { REFERENCE_NOW } from '../domain/referenceNow';
import { automationLoader } from './automation/automationProvider';
import { capacityLoader } from './capacity/capacityProvider';
import { funnelLoader } from './funnel/funnelProvider';
import { headlineLoader } from './headline/headlineProvider';
import { leadSourcesLoader } from './leadSources/leadSourcesProvider';
import type { PanelViewModel } from './shell/provider';

export function createPanelLoaders(
  repos: { jane: BookingRepository & InquiryRepository; automation: AutomationRepository },
  now: Date = REFERENCE_NOW,
): Readonly<Record<PanelId, () => Promise<PanelViewModel>>> {
  const { jane, automation } = repos;
  return {
    'headline-metrics': headlineLoader({ bookings: jane, inquiries: jane }),
    'intake-funnel': funnelLoader(jane, now),
    'lead-sources': leadSourcesLoader(jane, now),
    'clinician-capacity': capacityLoader(jane, now),
    'automation-impact': automationLoader(automation),
  };
}
