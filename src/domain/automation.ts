import type { DateRange } from './aggregates';

export interface AutomationAggregate {
  readonly range: DateRange;
  readonly adminHoursSaved: number;
  readonly intakeFormsAutoFiled: number;
  readonly remindersSent: number;
  readonly syncErrors: number;
}

export interface AutomationRepository {
  queryAutomation(range: DateRange): Promise<AutomationAggregate>;
}
