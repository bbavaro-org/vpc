import type { IntakeFunnel } from '../../application/funnel';
import type { PanelFetcher } from '../panelApi';
import type { PanelViewModel } from '../shell/provider';
import { FunnelPanel } from './FunnelPanel';

/** Loader for the 'intake-funnel' slot; no items means the slot shows its empty state. */
export function funnelLoader(fetchPanel: PanelFetcher): () => Promise<PanelViewModel> {
  return async () => {
    const { items, data } = await fetchPanel<IntakeFunnel>('intake-funnel');
    if (items.length === 0) return { items: [] };
    return { items, render: () => <FunnelPanel funnel={data} /> };
  };
}
