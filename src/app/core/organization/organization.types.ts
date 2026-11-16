export type OrgRole = 'owner' | 'admin' | 'member';

export type WhatsappConnectionStatus = 'not_connected' | 'connected' | 'error' | 'credit_line_missing';

/** standard : numero neuf ; coexistence : numero deja utilise dans WhatsApp Business. */
export type WhatsappConnectionMode = 'standard' | 'coexistence';

export interface OrganizationWhatsapp
{
    status: WhatsappConnectionStatus;
    wabaId?: string;
    phoneNumberId?: string;
    displayPhoneNumber?: string;
    verifiedName?: string;
    qualityRating?: string;
    messagingLimitTier?: string;
    connectionMode?: WhatsappConnectionMode | 'embedded' | 'manual';
    coexistence?: { isOnBizApp?: boolean; platformType?: string; contactsSyncRequestedAt?: string; historySyncRequestedAt?: string; syncError?: string } | null;
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
    plan?: { id: string; maxMembers: number };
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
    components?: {
        type: string; text?: string; format?: string;
        buttons?: { type: string; url?: string }[];
    }[];
}

/** Reference a un modele approuve pour un envoi. */
export interface TemplateRef
{
    name: string;
    language?: string;
    variables?: string[];
    headerMediaUrl?: string;
    /** Valeur de {{1}} pour un bouton URL dynamique. */
    urlVariableValue?: string;
}

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
    owner : 'Propriétaire',
    admin : 'Administrateur',
    member: 'Membre',
};

export const PLAN_LABELS: Record<string, string> = {
    decouverte: 'Découverte',
    starter   : 'Starter',
    business  : 'Business',
    pro       : 'Pro',
    enterprise: 'Entreprise',
};

export const TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
    marketing     : 'Marketing',
    utility       : 'Utilitaire',
    authentication: 'Authentification',
    service       : 'Service (réponse)',
};

/** Libelles et couleurs des statuts d'un modele WhatsApp Business. */
export const TEMPLATE_STATUS: Record<string, { label: string; tone: string }> = {
    APPROVED : { label: 'Approuvé', tone: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
    PENDING  : { label: 'En revue chez Meta', tone: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
    REJECTED : { label: 'Refusé', tone: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
    PAUSED   : { label: 'En pause', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
    DISABLED : { label: 'Désactivé', tone: 'bg-gray-200 text-gray-700' },
    IN_APPEAL: { label: 'En appel', tone: 'bg-blue-100 text-blue-800' },
    DELETED  : { label: 'Supprimé', tone: 'bg-gray-200 text-gray-700' },
};

/** Statuts pour lesquels Meta accepte une modification. */
export const TEMPLATE_EDITABLE_STATUSES = ['APPROVED', 'REJECTED', 'PAUSED'];

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
    /** cloud (API), business_app (WhatsApp Business, coexistence) ou history. */
    source?: 'cloud' | 'business_app' | 'history';
    status?: string;
    error?: string;
    sentBy?: { _id: string; firstName?: string; lastName?: string; email?: string } | null;
    timestamp: string;
}
