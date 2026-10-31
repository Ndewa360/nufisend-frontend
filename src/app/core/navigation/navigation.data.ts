/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';
import { cloneDeep } from 'lodash-es';
import { Navigation } from 'app/core/navigation/navigation.types';

/**
 * Menu principal de l'application, filtre par `buildNavigation` selon le
 * profil (super-admin, membre d'une organisation).
 */
export const defaultNavigation: FuseNavigationItem[] = [
    {
        id   : 'dashboard',
        title: 'Dashboard',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/dashboard'
    },
    {
        id   : 'annuary',
        title: 'Annuaire',
        type : 'group',
        icon : 'menu_book',
        link : '/annuaire',
        children: [
            {
                id   : 'contact',
                title: 'Contact',
                type : 'basic',
                icon : 'mat_outline:contact_phone',
                link : '/annuaire/contacts',
            },
            {
                id   : 'contact_group',
                title: 'Groupe',
                type : 'basic',
                icon : 'heroicons_outline:user-group',
                link : '/annuaire/groups',
            },
        ]
    },
    {
        id   : 'organization',
        title: 'Organisation',
        type : 'group',
        icon : 'heroicons_outline:office-building',
        link : '/organisation',
        children: [
            {
                id   : 'org_overview',
                title: 'Mon organisation',
                type : 'basic',
                icon : 'heroicons_outline:office-building',
                link : '/organisation/overview',
            },
            {
                id   : 'org_members',
                title: 'Membres',
                type : 'basic',
                icon : 'heroicons_outline:users',
                link : '/organisation/members',
            },
            {
                id   : 'org_whatsapp',
                title: 'WhatsApp Business',
                type : 'basic',
                icon : 'heroicons_outline:chat-alt-2',
                link : '/organisation/whatsapp',
            },
            {
                id   : 'parameter',
                title: 'Paramètres',
                type : 'basic',
                icon : 'heroicons_outline:cog',
                link : '/organisation/settings',
            },
        ]
    },
    {
        id   : 'message',
        title: 'Message',
        type : 'group',
        icon : 'mat_outline:message',
        link : '/messagerie',
        children: [
            {
                id   : 'direct_send',
                title: 'Messagerie',
                type : 'basic',
                icon : 'feather:send',
                link : '/messagerie',
            },
            {
                id   : 'template_message',
                title: 'Template de message',
                type : 'basic',
                icon : 'feather:file-text',
                link : '/message-template',
            },
            
        ]
    },
    {
        id   : 'inbox',
        title: 'Boîte de réception',
        type : 'basic',
        icon : 'heroicons_outline:inbox',
        link : '/inbox',
    },
    {
        id   : 'wallet',
        title: 'Portefeuille',
        type : 'basic',
        icon : 'heroicons_outline:credit-card',
        link : '/wallet',
    },
    {
        id   : 'sync_whatsapp',
        title: 'Synchro Whatsapp',
        type : 'basic',
        icon : 'mat_outline:schedule',
        link : '/sync_whatsapp',
    },
    {
        id   : 'settings',
        title: 'Paramètres',
        type : 'group',
        icon : 'heroicons_outline:view-list',
        link : '/settings',
        children: [
            {
                id   : 'general_settings',
                title: 'Paramètres généraux',
                type : 'basic',
                icon : 'heroicons_outline:cog',
                link : '/settings',
            },
            {
                id   : 'privacy_settings',
                title: 'Confidentialité & données',
                type : 'basic',
                icon : 'heroicons_outline:shield-check',
                link : '/settings/privacy',
            },
            {
                id   : 'api_keys',
                title: 'API & Intégration',
                type : 'basic',
                icon : 'heroicons_outline:code',
                link : '/api-keys',
            },
        ]
    },
    {
        id   : 'super_admin',
        title: 'Administration',
        type : 'basic',
        icon : 'heroicons_outline:shield-check',
        link : '/super-admin/dashboard'
    }
];

export interface NavigationAccess
{
    isSuperAdmin: boolean;
    /** Membre d'une organisation : envois par l'API WhatsApp Cloud. */
    isMember: boolean;
}

/** Entrees masquees selon le profil. */
const hiddenIds = (access: NavigationAccess): Set<string> =>
{
    const hidden = new Set<string>();
    if (!access.isSuperAdmin) hidden.add('super_admin');
    if (access.isMember) {
        // Le WhatsApp personnel n'est pas utilise par les membres.
        hidden.add('sync_whatsapp');
    } else {
        hidden.add('inbox');
        hidden.add('org_members');
        hidden.add('org_whatsapp');
    }
    return hidden;
};

const filterItems = (items: FuseNavigationItem[], hidden: Set<string>): FuseNavigationItem[] =>
    items
        .filter((item) => !hidden.has(item.id))
        .map((item) => (item.children ? { ...item, children: filterItems(item.children, hidden) } : item));

/** Toutes les dispositions Fuse partagent le meme menu. */
export const buildNavigation = (
    access: NavigationAccess = { isSuperAdmin: false, isMember: false },
): Navigation =>
{
    const items = filterItems(cloneDeep(defaultNavigation), hiddenIds(access));
    return {
        compact   : cloneDeep(items),
        default   : cloneDeep(items),
        futuristic: cloneDeep(items),
        horizontal: cloneDeep(items),
    };
};
