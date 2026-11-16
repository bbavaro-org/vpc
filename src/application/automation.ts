import type { AutomationRepository } from '../domain/automation';
import { REFERENCE_NOW } from '../domain/referenceNow';
import { lastPeriod } from '../domain/period';

export type SyncErrorStatus = 'needs-attention' | 'healthy';

export interface AutomationImpact {
  readonly adminHoursSaved: number;
  readonly intakeFormsAutoFiled: number;
  readonly remindersSent: number;
  readonly syncErrors: { readonly count: number; readonly status: SyncErrorStatus };
}

/** The four automation measures over the 30 days ending at `now`. */
export async function getAutomationImpact(
  repo: AutomationRepository,
  now: Date = REFERENCE_NOW,
): Promise<AutomationImpact> {
  const range = lastPeriod(now);
  const a = await repo.queryAutomation(range);
  return {
    adminHoursSaved: a.adminHoursSaved,
    intakeFormsAutoFiled: a.intakeFormsAutoFiled,
    remindersSent: a.remindersSent,
    syncErrors: { count: a.syncErrors, status: a.syncErrors > 0 ? 'needs-attention' : 'healthy' },
  };
}
