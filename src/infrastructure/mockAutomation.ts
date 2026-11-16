import type { DateRange } from '../domain/aggregates';
import type { AutomationAggregate, AutomationRepository } from '../domain/automation';
import type { AutomationEvent } from './automationSeed';
import automationJson from './seed-data/automation.json';

/** The only reader of raw automation events; returns aggregates only. */
export class MockAutomationRepository implements AutomationRepository {
  private readonly events: readonly AutomationEvent[];

  constructor(events: readonly AutomationEvent[] = automationJson as AutomationEvent[]) {
    this.events = events;
  }

  async queryAutomation(range: DateRange): Promise<AutomationAggregate> {
    const rows = this.events.filter((e) => {
      const t = Date.parse(e.at);
      return t >= range.from.getTime() && t < range.to.getTime();
    });
    const count = (kind: AutomationEvent['kind']) => rows.filter((e) => e.kind === kind).length;
    const minutes = rows.reduce((sum, e) => sum + e.minutesSaved, 0);
    return {
      range,
      adminHoursSaved: Math.round((minutes / 60) * 10) / 10,
      intakeFormsAutoFiled: count('formAutoFiled'),
      remindersSent: count('reminderSent'),
      syncErrors: count('syncError'),
    };
  }
}
