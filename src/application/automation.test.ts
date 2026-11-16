import { describe, expect, it } from 'vitest';
import type { AutomationRepository } from '../domain/automation';
import { REFERENCE_NOW } from '../domain/referenceNow';
import { getAutomationImpact } from './automation';

const stub = (syncErrors: number): AutomationRepository => ({
  queryAutomation: async (range) => ({
    range,
    adminHoursSaved: 12.5,
    intakeFormsAutoFiled: 40,
    remindersSent: 210,
    syncErrors,
  }),
});

describe('getAutomationImpact', () => {
  it('flags non-zero sync errors as needs-attention', async () => {
    expect((await getAutomationImpact(stub(3))).syncErrors).toEqual({
      count: 3,
      status: 'needs-attention',
    });
  });

  it('reports zero sync errors as healthy and passes the other measures through', async () => {
    const impact = await getAutomationImpact(stub(0));
    expect(impact.syncErrors).toEqual({ count: 0, status: 'healthy' });
    expect(impact).toMatchObject({ adminHoursSaved: 12.5, intakeFormsAutoFiled: 40, remindersSent: 210 });
  });

  it('queries the 30 days ending at now', async () => {
    let seen: { from: Date; to: Date } | undefined;
    await getAutomationImpact({
      queryAutomation: async (range) => {
        seen = range;
        return { range, adminHoursSaved: 0, intakeFormsAutoFiled: 0, remindersSent: 0, syncErrors: 0 };
      },
    });
    expect(seen?.to).toEqual(REFERENCE_NOW);
    expect(REFERENCE_NOW.getTime() - (seen as { from: Date }).from.getTime()).toBe(30 * 86_400_000);
  });
});
