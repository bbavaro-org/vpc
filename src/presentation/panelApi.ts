import type { PanelId } from '../domain';
import type { PanelItem } from './shell/provider';

/** Aggregate-only JSON served by `/api/panels/<id>`. */
export interface PanelPayload<T = unknown> {
  readonly items: ReadonlyArray<PanelItem>;
  readonly data: T;
}

export type PanelFetcher = <T = unknown>(id: PanelId) => Promise<PanelPayload<T>>;

/** Fetches one panel's aggregates from the server; rejects on a non-2xx response. */
export const fetchPanel: PanelFetcher = async <T,>(id: PanelId) => {
  const res = await fetch(`/api/panels/${id}`);
  if (!res.ok) throw new Error(`Panel "${id}" request failed with status ${res.status}`);
  return (await res.json()) as PanelPayload<T>;
};
