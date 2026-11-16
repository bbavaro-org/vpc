import { REFERENCE_NOW } from '../domain/referenceNow';
import { DAY_MS, PERIOD_DAYS } from '../domain/period';
import { WINDOW_DAYS, prng } from './seedGenerator';

export const AUTOMATION_SEED = 20260202;

export type AutomationEventKind = 'formAutoFiled' | 'reminderSent' | 'syncError';

export interface AutomationEvent {
  kind: AutomationEventKind;
  at: string;
  minutesSaved: number;
}

const MINUTES_SAVED: Readonly<Record<AutomationEventKind, number>> = {
  formAutoFiled: 15,
  reminderSent: 3,
  syncError: 0,
};

/** Deterministic automation-event log over the WINDOW_DAYS ending at REFERENCE_NOW, using its own PRNG stream. */
export function generateAutomationLog(seed: number): AutomationEvent[] {
  const rand = prng(seed);
  const now = REFERENCE_NOW.getTime();
  const events: AutomationEvent[] = [];
  const push = (kind: AutomationEventKind, dayOffset: number) => {
    const at = new Date(now - dayOffset * DAY_MS + Math.floor(rand() * DAY_MS * 0.99));
    events.push({ kind, at: at.toISOString(), minutesSaved: MINUTES_SAVED[kind] });
  };
  for (let d = WINDOW_DAYS; d >= 1; d--) {
    const forms = 1 + Math.floor(rand() * 4);
    const reminders = 3 + Math.floor(rand() * 6);
    for (let i = 0; i < forms; i++) push('formAutoFiled', d);
    for (let i = 0; i < reminders; i++) push('reminderSent', d);
    if (rand() < 0.06) push('syncError', d);
  }
  // Guarantee a visible sync error in the last PERIOD_DAYS days.
  if (!events.some((e) => e.kind === 'syncError' && Date.parse(e.at) >= now - PERIOD_DAYS * DAY_MS)) {
    push('syncError', 5);
  }
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

export function serializeAutomationLog(events: readonly AutomationEvent[]): string {
  return JSON.stringify(events, null, 2) + '\n';
}
