import { Membership } from './organization.types';

/**
 * Canal d'envoi effectif de l'utilisateur, source unique pour toute l'interface :
 * - 'cloud'    : membre d'une organisation, envois par le numero WhatsApp Business
 *                de l'organisation (aucun repli sur le compte personnel) ;
 * - 'personal' : compte personnel, envois par la session WhatsApp Web ;
 * - 'unknown'  : adhesion pas encore chargee ou chargement en echec. Aucun envoi
 *                n'est autorise tant que le canal n'est pas connu.
 *
 * `membership` : undefined = non charge, null = compte personnel, objet = membre.
 */
export type MessagingChannel = 'cloud' | 'personal' | 'unknown';

export const resolveMessagingChannel = (membership: Membership | null | undefined): MessagingChannel =>
{
    if (membership === undefined) return 'unknown';
    return membership ? 'cloud' : 'personal';
};

/** Vrai si l'organisation peut envoyer : compte actif et numero WhatsApp Business raccorde. */
export const isOrganizationCloudReady = (membership: Membership | null | undefined): boolean =>
{
    const org = membership?.organization;
    return !!org && org.status === 'active' && org.whatsapp?.status === 'connected';
};

/** Etat d'envoi effectif, selon le canal. */
export const isChannelReady = (
    membership: Membership | null | undefined,
    personalReady: boolean,
): boolean =>
{
    switch (resolveMessagingChannel(membership)) {
        case 'cloud': return isOrganizationCloudReady(membership);
        case 'personal': return !!personalReady;
        default: return false;
    }
};
