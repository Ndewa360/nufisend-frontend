import { PlanificationModel } from './planification.model';

/** Repartition des planifications selon ce qui leur arrive reellement. */
export interface PlanificationBreakdown {
  /** Active, solde suffisant, non epuisee : des envois partiront. */
  inProgress: number;
  /** Desactivee (arret manuel ou desactivation a l'adhesion). */
  inactive: number;
  /** Active mais suspendue pour solde insuffisant. */
  suspended: number;
  /** Active mais toutes ses dates sont passees. */
  ended: number;
}

/**
 * Une planification est "en cours" si elle est active, que son solde couvre les envois
 * et qu'elle n'est pas epuisee. Chaque autre cas est compte a part (une seule categorie).
 */
export function classifyPlanifications(plans: PlanificationModel[]): PlanificationBreakdown
{
  const breakdown: PlanificationBreakdown = { inProgress: 0, inactive: 0, suspended: 0, ended: 0 };
  (plans || []).forEach((plan) => {
    if (!plan.isActive) breakdown.inactive++;
    else if (plan.billingStatus && plan.billingStatus !== 'ok') breakdown.suspended++;
    else if (plan.isExhausted) breakdown.ended++;
    else breakdown.inProgress++;
  });
  return breakdown;
}
