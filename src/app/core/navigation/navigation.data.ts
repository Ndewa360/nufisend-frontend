/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';
import { cloneDeep } from 'lodash-es';
import { Navigation } from 'app/core/navigation/navigation.types';

/**
 * Menu principal de l'application. L'entree `super_admin` est masquee pour les
 * comptes non administrateurs (cf. LayoutComponent).
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
                id   : 'user',
                title: 'Utilisateurs',
                type : 'basic',
                icon : 'heroicons_outline:users',
                link : '/organisation/users',
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

/** Toutes les dispositions Fuse partagent le meme menu. */
export const buildNavigation = (): Navigation => ({
    compact   : cloneDeep(defaultNavigation),
    default   : cloneDeep(defaultNavigation),
    futuristic: cloneDeep(defaultNavigation),
    horizontal: cloneDeep(defaultNavigation),
});
