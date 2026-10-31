export type OrgRole = 'owner' | 'admin' | 'member';

export type SubscriptionStatus = 'pending_payment' | 'active' | 'past_due' | 'suspended';

export type WhatsappConnectionStatus = 'not_connected' | 'connected' | 'error';

export interface OrganizationWhatsapp
{
    status: WhatsappConnectionStatus;
    wabaId?: string;
    phoneNumberId?: string;
    displayPhoneNumber?: string;
    verifiedName?: string;
    qualityRating?: string;
    messagingLimitTier?: string;
    connectionMode?: 'embedded' | 'manual';
    creditLineAttached?: boolean;
    lastError?: string;
    connectedAt?: string;
    lastSyncAt?: string;
    embeddedSignup?: { enabled: boolean; appId: string | null; configId: string | null; graphVersion: string };
}

export interface Organization
{
    _id: string;
    name: string;
    owner: string;
    status: 'active' | 'suspended';
    plan: string;
    maxMembers?: number | null;
    suspensionReason?: string;
    whatsapp?: OrganizationWhatsapp;
    subscription?: {
        status: SubscriptionStatus;
        monthlyPrice: number;
        currentPeriodEnd?: string;
        graceUntil?: string;
        lastChargedAt?: string;
    };
    createdAt?: string;
}

/** Organisation de l'utilisateur connecte et son role. */
export interface Membership
{
    organization: Organization;
    role: OrgRole;
    isManager: boolean;
    membersCount: number;
    pendingInvitations: number;
    maxMembers: number;
    wallet: { available: number; reserved: number };
}

export interface OrganizationMember
{
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    isBlocked: boolean;
    role: OrgRole;
    joinedAt: string;
}

export interface OrganizationInvitation
{
    _id: string;
    email: string;
    role: OrgRole;
    status: 'pending' | 'accepted' | 'revoked' | 'expired';
    expiresAt: string;
    createdAt?: string;
    invitedBy?: { email: string; name?: string } | null;
}

export interface InvitationPreview
{
    organizationName: string;
    invitedBy: string;
    email: string;
    role: OrgRole;
    status: string;
    expiresAt: string;
    expired: boolean;
}

export interface OrganizationPlan
{
    id: string;
    price: number;
    maxMembers: number;
    onQuote: boolean;
}

export interface PlansCatalog
{
    currency: string;
    plans: OrganizationPlan[];
    cloudPrices: Record<string, number>;
}

export interface WhatsappTemplate
{
    _id: string;
    name: string;
    language: string;
    category: string;
    status: string;
    bodyVariables: number;
    headerFormat?: string | null;
    rejectedReason?: string;
    components?: { type: string; text?: string; format?: string }[];
}

/** Reference a un modele approuve pour un envoi. */
export interface TemplateRef
{
    name: string;
    language?: string;
    variables?: string[];
    headerMediaUrl?: string;
}

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
    owner : 'Propriétaire',
    admin : 'Administrateur',
    member: 'Membre',
};

export const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = {
    pending_payment: 'En attente de paiement',
    active         : 'Actif',
    past_due       : 'Impayé (période de grâce)',
    suspended      : 'Suspendu',
};

export const PLAN_LABELS: Record<string, string> = {
    pro       : 'Pro',
    business  : 'Business',
    enterprise: 'Entreprise',
};

export const TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
    marketing     : 'Marketing',
    utility       : 'Utilitaire',
    authentication: 'Authentification',
    service       : 'Service (réponse)',
};

export const templateBody = (template: WhatsappTemplate): string =>
    (template?.components || []).find((c) => c.type === 'BODY')?.text || '';

export interface Conversation
{
    _id: string;
    waId: string;
    name?: string;
    contact?: { _id: string; fullName: string } | null;
    lastMessageAt?: string;
    lastMessagePreview?: string;
    lastInboundAt?: string;
    unreadCount: number;
    optedOut: boolean;
    windowOpen: boolean;
    windowExpiresAt?: string | null;
}

export interface InboxMessage
{
    _id: string;
    conversation: string;
    direction: 'in' | 'out';
    type: string;
    text: string;
    media?: { id: string; mimeType?: string; filename?: string; caption?: string };
    waMessageId?: string;
    status?: string;
    error?: string;
    sentBy?: { _id: string; firstName?: string; lastName?: string; email?: string } | null;
    timestamp: string;
}
