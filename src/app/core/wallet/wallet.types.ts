export type PaymentOperator = 'MTN' | 'ORANGE';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

export interface WalletSummary {
    currency: string;
    available: number;
    reserved: number;
    total: number;
    totalTopup: number;
    totalSpent: number;
    freeMonthlyQuota: number;
    freeRemaining: number;
    prices: { text: number; attachment: number; custom: boolean };
    tiersEnabled: boolean;
    tiers: { minRecipients: number; discountPercent: number }[];
    minTopup: number;
    maxTopup: number;
    lowBalanceThreshold: number;
    paymentAvailable: boolean;
}

export interface LedgerEntry {
    _id: string;
    type: string;
    amount: number;
    availableAfter: number;
    reservedAfter: number;
    units: number;
    value: number;
    description: string;
    createdAt: string;
    user?: any;
    actor?: any;
    payment?: string;
    message?: string;
    planification?: string;
}

export interface WalletHold {
    _id: string;
    kind: 'send' | 'schedule' | 'weekly';
    amount: number;
    remaining: number;
    captured: number;
    released: number;
    occurrences: number;
    recipients: number;
    periodEnd?: string;
    description: string;
    createdAt: string;
    planification?: { _id: string; title: string; isActive: boolean; billingStatus: string };
    message?: { _id: string; title: string };
}

export interface Payment {
    _id: string;
    reference: string;
    providerRef?: string;
    operator: PaymentOperator;
    phone: string;
    amount: number;
    fee: number;
    feeFromProvider?: boolean;
    status: PaymentStatus;
    providerStatus?: string;
    failureReason?: string;
    checkAttempts?: number;
    creditedAt?: string;
    completedAt?: string;
    createdAt: string;
    user?: any;
    initResponse?: any;
    lastCheckResponse?: any;
    ledger?: LedgerEntry[];
}

export interface SendQuote {
    recipients: number;
    hasAttachment: boolean;
    basePrice: number;
    discountPercent: number;
    unitPrice: number;
    grossAmount: number;
    freeUnits: number;
    amountDue: number;
    available: number;
    reserved: number;
    sufficient: boolean;
    // Planification
    occurrences?: number;
    finiteOccurrences?: number;
    weekOccurrences?: number;
    occurrenceAmount?: number;
    hasRecurrence?: boolean;
}

export interface Receipt {
    receiptNumber: string;
    issuedAt: string;
    company: { name: string; address: string; taxId: string; registry: string };
    customer: { name: string; email: string };
    description: string;
    operator: PaymentOperator;
    phone: string;
    providerRef: string;
    currency: string;
    amount: number;
    vatRate: number;
    amountExclTax: number;
    vatAmount: number;
    notice: string;
}

export interface Paginated<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

/** Libelles des ecritures du grand livre. */
export const LEDGER_LABELS: Record<string, string> = {
    topup            : 'Recharge',
    hold             : 'Réservation',
    capture          : 'Messages facturés',
    debit            : 'Messages facturés',
    release          : 'Montant libéré',
    free             : 'Messages offerts',
    write_off        : 'Non encaissé',
    adjustment_credit: 'Crédit (ajustement)',
    adjustment_debit : 'Débit (ajustement)',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    pending: 'En attente',
    success: 'Réussie',
    failed : 'Échouée',
    expired: 'Non confirmée',
};

/** Sens de l'ecriture sur le solde disponible (+1 credit, -1 debit, 0 neutre). */
export const ledgerSign = (type: string): number => {
    if (['topup', 'adjustment_credit', 'release'].includes(type)) return 1;
    if (['hold', 'debit', 'adjustment_debit'].includes(type)) return -1;
    return 0;
};
