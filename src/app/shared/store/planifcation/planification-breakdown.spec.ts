import { classifyPlanifications } from './planification-breakdown';

describe('classifyPlanifications', () => {
  it('counts an active, funded and not exhausted plan as in progress', () => {
    expect(classifyPlanifications([{ isActive: true, billingStatus: 'ok', isExhausted: false }])).toEqual({
      inProgress: 1, inactive: 0, suspended: 0, ended: 0,
    });
  });

  it('never counts an inactive plan as in progress, even if funded', () => {
    expect(classifyPlanifications([{ isActive: false, billingStatus: 'ok', isExhausted: false }]).inProgress).toBe(0);
  });

  it('counts each plan in a single category', () => {
    const result = classifyPlanifications([
      { isActive: true, billingStatus: 'suspended_insufficient_funds', isExhausted: true },
      { isActive: true, billingStatus: 'ok', isExhausted: true },
      { isActive: false, billingStatus: 'ok', isExhausted: true },
      { isActive: true, billingStatus: 'ok', isExhausted: false },
    ]);
    expect(result).toEqual({ inProgress: 1, inactive: 1, suspended: 1, ended: 1 });
  });

  it('returns zeros for an empty list', () => {
    expect(classifyPlanifications([])).toEqual({ inProgress: 0, inactive: 0, suspended: 0, ended: 0 });
  });
});
