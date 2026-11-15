/** Etat d'un destinataire ou d'un envoi (valeurs renvoyees par l'API). */
export type CampaignChannel = 'whatsapp_web' | 'cloud';
export type CampaignKind = 'immediate' | 'scheduled';

/** Taux exprimes en pourcentage (null si aucun envoi). */
export interface CampaignRates {
    acceptanceRate: number | null;
    confirmationRate: number | null;
    failureRate: number | null;
}

export interface CampaignTotals extends CampaignRates {
    total: number;
    delivered: number;
    unconfirmed: number;
    /** Echecs francs (hors envois sans accuse). */
    failed: number;
}

/** Ligne de l'historique. */
export interface CampaignHistoryItem extends CampaignTotals {
    _id: string;
    title: string;
    channel: CampaignChannel;
    kind: CampaignKind;
    status: string;
    statusLabel: string;
    /** running | paused | done | cancelled | null (envoi termine ou pas de campagne). */
    campaignState: string | null;
    createdAt: string;
    sentAt: string | null;
    cost: number;
    isProgramme: boolean;
    ownedByMe: boolean;
}

export interface Paginated<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface HistoryParams {
    from?: Date | null;
    to?: Date | null;
    status?: string | null;
    channel?: CampaignChannel | null;
    kind?: CampaignKind | null;
    q?: string | null;
    page?: number;
    limit?: number;
}

export type ErrorCode =
    | 'NOT_ON_WHATSAPP'
    | 'INVALID_NUMBER'
    | 'SESSION_LOST'
    | 'BALANCE'
    | 'RATE_LIMIT'
    | 'UNCERTAIN'
    | 'CANCELLED'
    | 'CONTACT_DELETED'
    | 'OTHER';

/** Destinataire, numero masque. */
export interface CampaignRecipient {
    name: string;
    phone: string | null;
    status: string;
    errorCode: ErrorCode | null;
    errorLabel: string | null;
}

/** Occurrence d'une programmation. */
export interface CampaignRun {
    occurrenceDate: string;
    occurrenceTime: string;
    claimedAt: string;
    status: 'started' | 'done' | 'partial' | 'failed' | 'cancelled';
    finishedAt: string | null;
    result: { total?: number; sent?: number; delivered?: number; unconfirmed?: number; failed?: number; amountCharged?: number } | null;
}

/** Rapport complet d'une campagne. */
export interface CampaignReport extends Omit<CampaignHistoryItem, 'cost' | 'isProgramme' | 'ownedByMe' | 'sentAt'> {
    timeline: { createdAt: string; sentAt: string | null; startedAt: string | null; finishedAt: string | null };
    totals: CampaignTotals;
    errors: { code: ErrorCode; label: string; count: number }[];
    recipients: CampaignRecipient[];
    billing: { amountCharged: number; released: number; unitPrice: number | null; deliveredUnits: number; freeUnits: number };
    runs: CampaignRun[];
    retentionNotice: string;
}

/** Statistiques d'une periode. */
export interface CampaignStatsDay extends CampaignTotals {
    date: string;
    messages: number;
    cost: number;
}

export interface CampaignStats {
    period: { from: string; to: string; timeZone: string };
    totals: CampaignTotals & { messages: number; cost: number };
    byDay: CampaignStatsDay[];
    notice: string;
}

/** Occurrence d'une planification, avec son message. */
export interface PlanificationRunsPage {
    data: CampaignRun[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}
