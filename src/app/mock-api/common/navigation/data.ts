/* tslint:disable:max-line-length */
import { FuseNavigationItem } from '@fuse/components/navigation';

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
                id   : 'user',
                title: 'Utilisateur',
                type : 'basic',
                icon : 'heroicons_outline:users',
                link : '/organisation/users',
            },
            {
                id   : 'parameter',
                title: 'Parametre',
                type : 'basic',
                icon : 'heroicons_outline:cog',
                link : '/organisation/settings',
            },
        ]
    },
    {
        id   : 'message',
        title: 'Messagerie',
        type : 'group',
        icon : 'mat_outline:message',
        link : '/message',
        children: [
            {
                id   : 'direct_send',
                title: 'Envoi direct',
                type : 'basic',
                icon : 'feather:send',
                link : '/message/send',
            },
            {
                id   : 'planify',
                title: 'Planifier',
                type : 'basic',
                icon : 'mat_outline:schedule',
                link : '/message/schedule',
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
        id   : 'sync_whatsapp',
        title: 'Synchro Whatsapp',
        type : 'basic',
        icon : 'mat_outline:schedule',
        link : '/sync_whatsapp',
    },
    {
        id   : 'settings',
        title: 'Paramètres',
        type : 'basic',
        icon : 'heroicons_outline:view-list',
        link : '/settings'
    }
];
export const compactNavigation: FuseNavigationItem[] = [...defaultNavigation];
export const futuristicNavigation: FuseNavigationItem[] = [...defaultNavigation];
export const horizontalNavigation: FuseNavigationItem[] = [...defaultNavigation];
