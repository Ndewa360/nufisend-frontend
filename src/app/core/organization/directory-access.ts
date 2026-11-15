import { Membership } from './organization.types';

/**
 * Ecriture de l'annuaire partage (contacts et groupes).
 * Miroir du backend (DIRECTORY_MANAGER_ROLES) : seuls le proprietaire et les administrateurs
 * modifient l'annuaire d'une organisation. Un compte personnel (membership === null) ecrit librement.
 * Tant que l'adhesion n'est pas chargee (undefined), rien n'est autorise.
 */
export function canWriteDirectory(membership: Membership | null | undefined): boolean
{
    if (membership === undefined) return false;
    if (membership === null) return true;
    return membership.role === 'owner' || membership.role === 'admin';
}
