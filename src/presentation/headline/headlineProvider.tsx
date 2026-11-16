import { getHeadlineMetrics, type HeadlineDeps } from '../../application/headline';
import { REFERENCE_NOW } from '../../domain/referenceNow';
import type { PanelViewModel } from '../shell/provider';
import { HeadlineCards } from './HeadlineCards';

/** Loader for the 'headline-metrics' slot; reads the use case's view models only. */
export function headlineLoader(
  deps: HeadlineDeps,
  now: Date = REFERENCE_NOW,
): () => Promise<PanelViewModel> {
  return async () => {
    const metrics = await getHeadlineMetrics(deps, now);
    return {
      items: [{ label: 'New inquiries', value: String(metrics.newInquiries.current ?? 'No data') }],
      render: () => <HeadlineCards metrics={metrics} />,
    };
  };
}
