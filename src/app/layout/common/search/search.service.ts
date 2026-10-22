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

        if ( !normalizedQuery )
        {
            return [];
        }

        const resultSets: SearchResultSet[] = [];

        const contacts = this._searchContacts(normalizedQuery);
        if ( contacts.length )
        {
            resultSets.push({ id: 'contacts', label: 'Contacts', results: contacts });
        }

        const groups = this._searchGroups(normalizedQuery);
        if ( groups.length )
        {
            resultSets.push({ id: 'groups', label: 'Groupes', results: groups });
        }

        const messageTemplates = this._searchMessageTemplates(normalizedQuery);
        if ( messageTemplates.length )
        {
            resultSets.push({ id: 'message-templates', label: 'Templates de message', results: messageTemplates });
        }

        const pages = this._searchPages(normalizedQuery);
        if ( pages.length )
        {
            resultSets.push({ id: 'pages', label: 'Pages', results: pages });
        }

        return resultSets;
    }

    private _searchContacts(query: string): SearchResult[]
    {
        const contacts: ContactModel[] = this._store.selectSnapshot(ContactState.selectStateData) || [];

        return contacts
            .filter((contact) => {
                const emails = (contact.emails || []).map((email) => email.email).join(' ');
                const phones = (contact.phoneNumbers || []).map((phone) => phone.phoneNumber).join(' ');

                return this._matches([
                    contact.fullName,
                    contact.jobTitle,
                    contact.organization,
                    contact.company,
                    contact.address,
                    emails,
                    phones
                ], query);
            })
            .slice(0, 5)
            .map((contact) => {
                const phone = contact.phoneNumbers?.[0]?.phoneNumber;
                const email = contact.emails?.[0]?.email;
                const title = contact.fullName || phone || email || 'Contact sans nom';
                const description = [contact.jobTitle, contact.company, email, phone]
                    .filter(Boolean)
                    .join(' · ');

                return {
                    id         : contact._id,
                    title,
                    description: description || undefined,
                    avatar     : contact.profilePicture || contact.avatar,
                    icon       : 'heroicons_outline:user-circle',
                    link       : `/annuaire/contacts/${contact._id}`,
                    value      : title
                };
            });
    }

    private _searchGroups(query: string): SearchResult[]
    {
        const groups: GroupModel[] = this._store.selectSnapshot(GroupState.selectStateData) || [];

        return groups
            .filter((group) => this._matches([
                group.name || group.groupName,
                group.description
            ], query))
            .slice(0, 5)
            .map((group) => {
                const title = group.name || group.groupName || 'Groupe sans nom';

                return {
                    id         : group._id,
                    title,
                    description: group.description || undefined,
                    avatar     : group.profilePicture,
                    icon       : group.icon || 'heroicons_outline:user-group',
                    link       : `/annuaire/groups/${group._id}`,
                    value      : title
                };
            });
    }

    private _searchMessageTemplates(query: string): SearchResult[]
    {
        const templates: MessageTemplateModel[] = this._store.selectSnapshot(MessageTemplateState.selectStateData) || [];

        return templates
            .filter((template) => this._matches([
                template.title,
                template.description,
                this._plainText(template.content)
            ], query))
            .slice(0, 5)
            .map((template) => {
                const title = template.title || 'Template sans titre';
                const content = this._plainText(template.content);

                return {
                    id         : template._id,
                    title,
                    description: template.description || content?.slice(0, 120) || undefined,
                    icon       : 'feather:file-text',
                    link       : `/message-template/${template._id}`,
                    value      : title
                };
            });
    }

    private _searchPages(query: string): SearchResult[]
    {
        return this._flattenNavigation(this._navigation)
            .filter((item) => this._matches([item.title, item.subtitle], query))
            .slice(0, 5)
            .map((item) => ({
                title      : item.title,
                description: item.subtitle || item.link,
                icon       : item.icon,
                link       : item.link,
                value      : item.title
            }));
    }

    private _flattenNavigation(items: FuseNavigationItem[]): FuseNavigationItem[]
    {
        const flatItems: FuseNavigationItem[] = [];

        (items || []).forEach((item) => {
            if ( item.hidden?.(item) || item.type === 'divider' || item.type === 'spacer' )
            {
                return;
            }

            if ( item.children?.length )
            {
                flatItems.push(...this._flattenNavigation(item.children));
                return;
            }

            if ( item.link && !item.externalLink )
            {
                flatItems.push(item);
            }
        });

        return flatItems;
    }

    private _matches(values: Array<string | undefined | null>, query: string): boolean
    {
        return values.some((value) => this._normalize(value).includes(query));
    }

    private _normalize(value: string | undefined | null): string
    {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    private _plainText(value: string | undefined | null): string
    {
        return String(value ?? '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
