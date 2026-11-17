import type { AutomationImpact } from '../../application/automation';
import type { PanelFetcher } from '../panelApi';
import type { PanelViewModel } from '../shell/provider';
import { AutomationPanel } from './AutomationPanel';

/** Loader for the 'automation-impact' slot; maps the endpoint's aggregate JSON. */
export function automationLoader(fetchPanel: PanelFetcher): () => Promise<PanelViewModel> {
  return async () => {
    const { items, data } = await fetchPanel<AutomationImpact>('automation-impact');
    return { items, render: () => <AutomationPanel impact={data} /> };
  };
}
