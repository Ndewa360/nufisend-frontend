import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { ContactState } from 'app/shared/store/contact';
import { GroupState } from 'app/shared/store/group';
import { MessageTemplateState } from 'app/shared/store/message-template';

export interface SearchResult {
    id: string;
    label: string;
    description?: string;
    link: string;
    type: 'contact' | 'group' | 'template';
    icon: string;
}

export interface SearchResultSet {
    id: string;
    label: string;
    results: SearchResult[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {

    constructor(private _store: Store) {}

    search(query: string): SearchResultSet[] {
        const q = query.toLowerCase().trim();
        if (!q) return [];

        const contacts = this._store.selectSnapshot(ContactState.selectStateData);
        const groups   = this._store.selectSnapshot(GroupState.selectStateData);
        const templates = this._store.selectSnapshot(MessageTemplateState.selectStateData);

        const contactResults: SearchResult[] = contacts
            .filter(c => c.fullName?.toLowerCase().includes(q) ||
                         c.emails?.some(e => e.email?.toLowerCase().includes(q)))
            .slice(0, 5)
            .map(c => ({
                id: c._id,
                label: c.fullName || '',
                description: c.emails?.[0]?.email || c.phoneNumbers?.[0]?.phoneNumber || '',
                link: `/annuaire/contacts`,
                type: 'contact',
                icon: 'heroicons_outline:user'
            }));

        const groupResults: SearchResult[] = groups
            .filter(g => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
            .slice(0, 5)
            .map(g => ({
                id: g._id,
                label: g.name || '',
                description: g.description || '',
                link: `/annuaire/groups`,
                type: 'group',
                icon: 'heroicons_outline:user-group'
            }));

        const templateResults: SearchResult[] = templates
            .filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
            .slice(0, 5)
            .map(t => ({
                id: t._id,
                label: t.title || '',
                description: t.description || '',
                link: `/message-template`,
                type: 'template',
                icon: 'heroicons_outline:template'
            }));

        const sets: SearchResultSet[] = [];
        if (contactResults.length)  sets.push({ id: 'contacts',  label: 'Contacts',           results: contactResults });
        if (groupResults.length)    sets.push({ id: 'groups',    label: 'Groupes',             results: groupResults });
        if (templateResults.length) sets.push({ id: 'templates', label: 'Templates de message', results: templateResults });

        return sets;
    }
}
