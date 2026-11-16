import { getAutomationImpact } from '../../application/automation';
import type { AutomationRepository } from '../../domain/automation';
import { REFERENCE_NOW } from '../../domain/referenceNow';
import type { PanelViewModel } from '../shell/provider';
import { AutomationPanel } from './AutomationPanel';

/** Loader for the 'automation-impact' slot; always returns the four measures. */
export function automationLoader(
  repo: AutomationRepository,
  now: Date = REFERENCE_NOW,
): () => Promise<PanelViewModel> {
  return async () => {
    const impact = await getAutomationImpact(repo, now);
    return {
      items: [
        { label: 'Admin hours saved', value: String(impact.adminHoursSaved) },
        { label: 'Intake forms auto-filed', value: String(impact.intakeFormsAutoFiled) },
        { label: 'Reminders sent', value: String(impact.remindersSent) },
        { label: 'Sync errors', value: String(impact.syncErrors.count) },
      ],
      render: () => <AutomationPanel impact={impact} />,
    };
  };
}
