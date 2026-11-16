import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { REFERENCE_NOW } from '../domain';
import { AUTOMATION_SEED, generateAutomationLog, serializeAutomationLog } from './automationSeed';
import { MockAutomationRepository } from './mockAutomation';

const DAY = 86_400_000;
const last30 = { from: new Date(REFERENCE_NOW.getTime() - 30 * DAY), to: REFERENCE_NOW };

describe('mock automation repository', () => {
  it('returns exactly the aggregate keys with positive counts for the last 30 days', async () => {
    const agg = await new MockAutomationRepository().queryAutomation(last30);
    expect(Object.keys(agg).sort()).toEqual(
      ['adminHoursSaved', 'intakeFormsAutoFiled', 'range', 'remindersSent', 'syncErrors'].sort(),
    );
    expect(agg.adminHoursSaved).toBeGreaterThan(0);
    expect(agg.intakeFormsAutoFiled).toBeGreaterThan(0);
    expect(agg.remindersSent).toBeGreaterThan(0);
    expect(agg.syncErrors).toBeGreaterThan(0);
  });

  it('fixture equals a fresh regenerate', () => {
    const onDisk = readFileSync(new URL('./seed-data/automation.json', import.meta.url), 'utf8');
    expect(onDisk).toBe(serializeAutomationLog(generateAutomationLog(AUTOMATION_SEED)));
  });

  it('empty range returns zeros', async () => {
    const agg = await new MockAutomationRepository().queryAutomation({
      from: REFERENCE_NOW,
      to: REFERENCE_NOW,
    });
    expect(agg.adminHoursSaved).toBe(0);
    expect(agg.intakeFormsAutoFiled).toBe(0);
    expect(agg.remindersSent).toBe(0);
    expect(agg.syncErrors).toBe(0);
  });

  it('aggregate JSON has no ISO timestamp beyond the range or any id', async () => {
    const agg = await new MockAutomationRepository().queryAutomation(last30);
    const json = JSON.stringify({ ...agg, range: undefined });
    expect(json).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(json).not.toMatch(/"id"/);
  });
});
