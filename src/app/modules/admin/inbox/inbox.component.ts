import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    NgZone,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { OrganizationService, readApiError } from 'app/core/organization/organization.service';
import { Conversation, InboxMessage, Membership } from 'app/core/organization/organization.types';
import { TemplateSelection } from 'app/shared/components/cloud-template-picker/cloud-template-picker.component';
import { Socket } from 'ngx-socket-io';
import { ToastrService } from 'ngx-toastr';
import { Subject, debounceTime, takeUntil } from 'rxjs';

const STATUS_ICONS: Record<string, string> = {
    pending  : 'heroicons_outline:clock',
    sent     : 'heroicons_outline:check',
    delivered: 'heroicons_outline:check-circle',
    read     : 'heroicons_solid:check-circle',
    failed   : 'heroicons_outline:exclamation-circle',
};

/**
 * Boite de reception partagee de l'organisation : conversations avec les
 * clients ecrivant au numero WhatsApp Business, reponses (texte libre dans la
 * fenetre de 24 h, modele approuve sinon), mise a jour en temps reel.
 */
@Component({
    selector       : 'app-inbox',
    templateUrl    : './inbox.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InboxComponent implements OnInit, OnDestroy
{
    @ViewChild('thread') thread: ElementRef<HTMLElement>;

    membership: Membership | null = null;
    conversations: Conversation[] = [];
    total = 0;
    unreadConversations = 0;
    search = '';
    unreadOnly = false;
    loadingList = false;

    active: Conversation | null = null;
    messages: InboxMessage[] = [];
    loadingThread = false;
    hasOlder = false;

    replyText = '';
    useTemplate = false;
    templateSelection: TemplateSelection | null = null;
    sending = false;

    readonly statusIcons = STATUS_ICONS;

    private readonly _search$ = new Subject<void>();
    private readonly _unsubscribeAll = new Subject<void>();
    private readonly _onMessage = (event: any) => this._zone.run(() => this._handleIncoming(event));
    private readonly _onStatus = (event: any) => this._zone.run(() => this._handleStatus(event));

    constructor(
        private _organizationService: OrganizationService,
        private _socket: Socket,
        private _toastr: ToastrService,
        private _zone: NgZone,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    ngOnInit(): void
    {
        this._organizationService.loadedMembership$.pipe(takeUntil(this._unsubscribeAll)).subscribe((membership) => {
            this.membership = membership;
            this._cdr.markForCheck();
        });
        this._search$.pipe(debounceTime(300), takeUntil(this._unsubscribeAll)).subscribe(() => this.loadConversations());
        const socket = this._socket.ioSocket as any;
        socket?.on('inbox-message', this._onMessage);
        socket?.on('inbox-status', this._onStatus);
        this.loadConversations();
    }

    ngOnDestroy(): void
    {
        const socket = this._socket.ioSocket as any;
        socket?.off?.('inbox-message', this._onMessage);
        socket?.off?.('inbox-status', this._onStatus);
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get canSend(): boolean
    {
        const org = this.membership?.organization;
        return !!org && org.status === 'active'
            && org.subscription?.status !== 'pending_payment'
            && org.subscription?.status !== 'suspended'
            && org.whatsapp?.status === 'connected';
    }

    get windowOpen(): boolean
    {
        return !!this.active?.lastInboundAt
            && Date.now() - new Date(this.active.lastInboundAt).getTime() < 24 * 3600_000;
    }

    get windowHoursLeft(): number
    {
        if (!this.active?.lastInboundAt) return 0;
        const left = new Date(this.active.lastInboundAt).getTime() + 24 * 3600_000 - Date.now();
        return Math.max(0, Math.ceil(left / 3600_000));
    }

    get canReply(): boolean
    {
        if (!this.canSend || !this.active || this.active.optedOut || this.sending) return false;
        if (this.useTemplate || !this.windowOpen) return !!this.templateSelection?.template && this.templateSelection.complete;
        return !!this.replyText.trim();
    }

    titleOf(conversation: Conversation): string
    {
        return conversation.contact?.fullName || conversation.name || `+${conversation.waId}`;
    }

    onSearch(): void
    {
        this._search$.next();
    }

    toggleUnread(): void
    {
        this.unreadOnly = !this.unreadOnly;
        this.loadConversations();
    }

    loadConversations(): void
    {
        this.loadingList = true;
        this._organizationService.conversations({ search: this.search.trim(), unread: this.unreadOnly, limit: 50 }).subscribe({
            next : (result) => {
                this.conversations = result.data;
                this.total = result.total;
                this.unreadConversations = result.unreadConversations;
                this.loadingList = false;
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.loadingList = false;
                this._toastr.error(readApiError(error), 'Boîte de réception');
                this._cdr.markForCheck();
            },
        });
    }

    open(conversation: Conversation): void
    {
        this.active = conversation;
        this.messages = [];
        this.replyText = '';
        this.useTemplate = false;
        this.templateSelection = null;
        this.loadingThread = true;
        this._organizationService.conversationMessages(conversation._id).subscribe({
            next : (result) => {
                this.active = result.conversation;
                this.messages = result.messages;
                this.hasOlder = result.messages.length >= 50;
                this.loadingThread = false;
                this._cdr.markForCheck();
                this._scrollToBottom();
                this._markRead();
            },
            error: (error) => {
                this.loadingThread = false;
                this._toastr.error(readApiError(error), 'Boîte de réception');
                this._cdr.markForCheck();
            },
        });
    }

    loadOlder(): void
    {
        if (!this.active || !this.messages.length) return;
        this._organizationService.conversationMessages(this.active._id, this.messages[0].timestamp).subscribe({
            next : (result) => {
                this.messages = [...result.messages, ...this.messages];
                this.hasOlder = result.messages.length >= 50;
                this._cdr.markForCheck();
            },
            error: () => undefined,
        });
    }

    close(): void
    {
        this.active = null;
        this.messages = [];
    }

    setTemplate(selection: TemplateSelection): void
    {
        this.templateSelection = selection;
        this._cdr.markForCheck();
    }

    send(): void
    {
        if (!this.canReply || !this.active) return;
        const withTemplate = this.useTemplate || !this.windowOpen;
        const input = withTemplate
            ? { template: this.templateSelection.template }
            : { text: this.replyText.trim() };
        this.sending = true;
        const conversationId = this.active._id;
        this._organizationService.reply(conversationId, input).subscribe({
            next : () => {
                this.sending = false;
                this.replyText = '';
                // Le message apparait des que le worker l'a envoye (evenement temps reel).
                this._toastr.info('Réponse en cours d’envoi', 'Boîte de réception', { timeOut: 2000 });
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.sending = false;
                this._toastr.error(readApiError(error), 'Réponse non envoyée');
                this._cdr.markForCheck();
            },
        });
    }

    downloadMedia(message: InboxMessage): void
    {
        if (!message.media?.id) return;
        this._organizationService.media(message.media.id).subscribe({
            next : (blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank', 'noopener');
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
            },
            error: () => this._toastr.error('Média indisponible (expiré chez Meta ?)', 'Boîte de réception'),
        });
    }

    senderName(message: InboxMessage): string
    {
        const by = message.sentBy;
        if (!by) return message.direction === 'out' ? 'Campagne' : '';
        return [by.firstName, by.lastName].filter(Boolean).join(' ') || by.email || '';
    }

    trackById(_: number, item: { _id: string }): string
    {
        return item._id;
    }

    // ------------------------------------------------------------- temps reel

    private _handleIncoming(event: any): void
    {
        const conversation: Conversation = event?.conversation;
        if (!conversation?._id) return;
        const index = this.conversations.findIndex((c) => c._id === conversation._id);
        const previous = index >= 0 ? this.conversations[index] : null;
        const merged: Conversation = {
            ...(previous || {}),
            ...conversation,
            contact  : previous?.contact ?? conversation.contact ?? null,
            windowOpen: true,
        };
        if (index >= 0) this.conversations.splice(index, 1);
        else {
            this.total += 1;
        }
        if (!previous?.unreadCount && merged.unreadCount) this.unreadConversations += 1;
        this.conversations = [merged, ...this.conversations];

        if (this.active?._id === conversation._id) {
            this.active = { ...this.active, ...merged };
            if (event.message && !this.messages.some((m) => m._id === event.message._id)) {
                this.messages = [...this.messages, event.message];
                this._scrollToBottom();
            }
            this._markRead();
        }
        this._cdr.markForCheck();
    }

    private _handleStatus(event: any): void
    {
        if (this.active?._id !== event?.conversationId) return;
        const message = this.messages.find((m) => m._id === event.messageId);
        if (message) {
            message.status = event.status;
            this.messages = [...this.messages];
            this._cdr.markForCheck();
            return;
        }
        // Message sortant pas encore affiche (reponse envoyee par le worker) : rechargement.
        this._organizationService.conversationMessages(this.active._id).subscribe({
            next : (result) => {
                this.messages = result.messages;
                this._cdr.markForCheck();
                this._scrollToBottom();
            },
            error: () => undefined,
        });
    }

    private _markRead(): void
    {
        const active = this.active;
        if (!active?.unreadCount) return;
        this._organizationService.markConversationRead(active._id).subscribe({
            next : () => {
                active.unreadCount = 0;
                const listed = this.conversations.find((c) => c._id === active._id);
                if (listed) listed.unreadCount = 0;
                this.unreadConversations = Math.max(0, this.unreadConversations - 1);
                this._cdr.markForCheck();
            },
            error: () => undefined,
        });
    }

    private _scrollToBottom(): void
    {
        setTimeout(() => {
            const element = this.thread?.nativeElement;
            if (element) element.scrollTop = element.scrollHeight;
        });
    }
}
