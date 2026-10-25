import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { ContactModel, ContactState, GroupModel, GroupState, MessageTemplateModel, MessageTemplateState } from 'app/shared/store';
import { Subject, takeUntil } from 'rxjs';

export interface SearchResult
{
    id?: string;
    name?: string;
    title?: string;
    description?: string;
    avatar?: string;
    icon?: string;
    link: string;
    value?: string;
}

export interface SearchResultSet
{
    id: string;
    label: string;
    results: SearchResult[];
}

@Injectable({
    providedIn: 'root'
})
export class SearchService implements OnDestroy
{
    private _navigation: FuseNavigationItem[] = [];
    private _unsubscribeAll: Subject<void> = new Subject<void>();

    constructor(
        private _store: Store,
        private _navigationService: NavigationService
    )
    {
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation) => {
                this._navigation = navigation?.default || [];
            });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    search(query: string): SearchResultSet[]
    {
        const normalizedQuery = this._normalize(query);
        if ( !normalizedQuery ) return [];

        const resultSets: SearchResultSet[] = [];

        const contacts = this._searchContacts(normalizedQuery);
        if ( contacts.length ) resultSets.push({ id: 'contacts', label: 'Contacts', results: contacts });

        const groups = this._searchGroups(normalizedQuery);
        if ( groups.length ) resultSets.push({ id: 'groups', label: 'Groupes', results: groups });

        const templates = this._searchMessageTemplates(normalizedQuery);
        if ( templates.length ) resultSets.push({ id: 'message-templates', label: 'Templates de message', results: templates });

        const pages = this._searchPages(normalizedQuery);
        if ( pages.length ) resultSets.push({ id: 'pages', label: 'Pages', results: pages });

        return resultSets;
    }

    private _searchContacts(query: string): SearchResult[]
    {
        const contacts: ContactModel[] = this._store.selectSnapshot(ContactState.selectStateData) || [];
        return contacts
            .filter((c) => {
                const emails = (c.emails || []).map(e => e.email).join(' ');
                const phones = (c.phoneNumbers || []).map(p => p.phoneNumber).join(' ');
                return this._matches([c.fullName, c.jobTitle, c.organization, c.company, c.address, emails, phones], query);
            })
            .slice(0, 5)
            .map((c) => {
                const phone = c.phoneNumbers?.[0]?.phoneNumber;
                const email = c.emails?.[0]?.email;
                const title = c.fullName || phone || email || 'Contact sans nom';
                const description = [c.jobTitle, c.company, email, phone].filter(Boolean).join(' · ');
                return {
                    id: c._id, title,
                    description: description || undefined,
                    avatar: c.profilePicture || c.avatar,
                    icon: 'heroicons_outline:user-circle',
                    link: `/annuaire/contacts/${c._id}`,
                    value: title
                };
            });
    }

    private _searchGroups(query: string): SearchResult[]
    {
        const groups: GroupModel[] = this._store.selectSnapshot(GroupState.selectStateData) || [];
        return groups
            .filter((g) => this._matches([g.name || g.groupName, g.description], query))
            .slice(0, 5)
            .map((g) => {
                const title = g.name || g.groupName || 'Groupe sans nom';
                return {
                    id: g._id, title,
                    description: g.description || undefined,
                    avatar: g.profilePicture,
                    icon: g.icon || 'heroicons_outline:user-group',
                    link: `/annuaire/groups/${g._id}`,
                    value: title
                };
            });
    }

    private _searchMessageTemplates(query: string): SearchResult[]
    {
        const templates: MessageTemplateModel[] = this._store.selectSnapshot(MessageTemplateState.selectStateData) || [];
        return templates
            .filter((t) => this._matches([t.title, t.description, this._plainText(t.content)], query))
            .slice(0, 5)
            .map((t) => {
                const title = t.title || 'Template sans titre';
                return {
                    id: t._id, title,
                    description: t.description || this._plainText(t.content)?.slice(0, 120) || undefined,
                    icon: 'feather:file-text',
                    link: `/message-template/${t._id}`,
                    value: title
                };
            });
    }

    private _searchPages(query: string): SearchResult[]
    {
        return this._flattenNavigation(this._navigation)
            .filter((item) => this._matches([item.title, item.subtitle], query))
            .slice(0, 5)
            .map((item) => ({
                title: item.title,
                description: item.subtitle || item.link,
                icon: item.icon,
                link: item.link,
                value: item.title
            }));
    }

    private _flattenNavigation(items: FuseNavigationItem[]): FuseNavigationItem[]
    {
        const flat: FuseNavigationItem[] = [];
        (items || []).forEach((item) => {
            if ( item.hidden?.(item) || item.type === 'divider' || item.type === 'spacer' ) return;
            if ( item.children?.length ) { flat.push(...this._flattenNavigation(item.children)); return; }
            if ( item.link && !item.externalLink ) flat.push(item);
        });
        return flat;
    }

    private _matches(values: Array<string | undefined | null>, query: string): boolean
    {
        return values.some((v) => this._normalize(v).includes(query));
    }

    private _normalize(value: string | undefined | null): string
    {
        return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    private _plainText(value: string | undefined | null): string
    {
        return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
}
