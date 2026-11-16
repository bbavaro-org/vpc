export const SLOT_IDS = [
  'headline-metrics',
  'intake-funnel',
  'lead-sources',
  'clinician-capacity',
  'automation-impact',
] as const;

export type SlotId = (typeof SLOT_IDS)[number];

export const SLOT_TITLES: Readonly<Record<SlotId, string>> = {
  'headline-metrics': 'Headline metrics',
  'intake-funnel': 'Intake funnel',
  'lead-sources': 'Lead sources',
  'clinician-capacity': 'Clinician capacity',
  'automation-impact': 'Automation impact',
};

export interface PanelItem {
  readonly label: string;
  readonly value: string;
}

/** Already-aggregated view model a slot renders. No items means the slot is empty. */
export interface PanelViewModel {
  readonly items: ReadonlyArray<PanelItem>;
}

/**
 * Injected seam: each slot's data comes from its own loader. A slot without a
 * loader renders its empty state. A rejected loader renders that slot's error state only.
 */
export type DashboardProvider = Readonly<Partial<Record<SlotId, () => Promise<PanelViewModel>>>>;

export type SlotState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly viewModel: PanelViewModel };

export async function resolveSlot(provider: DashboardProvider, slot: SlotId): Promise<SlotState> {
  const load = provider[slot];
  if (!load) return { status: 'empty' };
  try {
    const viewModel = await load();
    if (viewModel.items.length === 0) return { status: 'empty' };
    return { status: 'ready', viewModel };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' };
  }
}
