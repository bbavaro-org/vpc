import type { PanelId } from '../domain';
import { automationLoader } from './automation/automationProvider';
import { capacityLoader } from './capacity/capacityProvider';
import { funnelLoader } from './funnel/funnelProvider';
import { headlineLoader } from './headline/headlineProvider';
import { leadSourcesLoader } from './leadSources/leadSourcesProvider';
import { fetchPanel, type PanelFetcher } from './panelApi';
import type { PanelViewModel } from './shell/provider';

export function createPanelLoaders(
  fetcher: PanelFetcher = fetchPanel,
): Readonly<Record<PanelId, () => Promise<PanelViewModel>>> {
  return {
    'headline-metrics': headlineLoader(fetcher),
    'intake-funnel': funnelLoader(fetcher),
    'lead-sources': leadSourcesLoader(fetcher),
    'clinician-capacity': capacityLoader(fetcher),
    'automation-impact': automationLoader(fetcher),
  };
}
