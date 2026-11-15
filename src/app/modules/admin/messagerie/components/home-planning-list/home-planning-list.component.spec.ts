import { MessageStatus } from 'app/shared/store';

/** Regles d'etat des planifications (miroir de classifyPlanifications, sans dependance Angular). */
describe('MessageStatus labels used by the planning list', () => {
  it('uses the enum values sent by the backend', () => {
    expect(MessageStatus.PAUSED).toBe('paused');
    expect(MessageStatus.SCHEDULED).toBe('scheduled');
  });
});
