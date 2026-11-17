import type { HeadlineMetrics } from '../../application/headline';
import type { PanelFetcher } from '../panelApi';
import type { PanelViewModel } from '../shell/provider';
import { HeadlineCards } from './HeadlineCards';

/** Loader for the 'headline-metrics' slot; maps the endpoint's aggregate JSON. */
export function headlineLoader(fetchPanel: PanelFetcher): () => Promise<PanelViewModel> {
  return async () => {
    const { items, data } = await fetchPanel<HeadlineMetrics>('headline-metrics');
    return { items, render: () => <HeadlineCards metrics={data} /> };
  };
}
