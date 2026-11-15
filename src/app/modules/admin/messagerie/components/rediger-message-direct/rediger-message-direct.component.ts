import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Select, Store } from '@ngxs/store';
import { MessageTemplateAction, MessageTemplateModel, MessageTemplateState } from 'app/shared/store';
import { ATTACHMENT_ACCEPT, ATTACHMENT_HINT, attachmentKindOf, cloudAttachmentErrorOf, validateAttachments } from 'app/shared/utils/attachment-rules';
import { Observable, Subject, takeUntil } from 'rxjs';

/** Contenu rédigé, émis vers le parent à chaque changement. */
export interface ComposedMessage {
  /** Toujours null : un modèle choisi pré-remplit le corps, qui devient un texte libre modifiable. */
  messageTemplate: MessageTemplateModel | null;
  message: string | null;
  files: File[];
  title: string;
  /** Combinaison refusée par le canal (ex. texte + audio en Cloud). Bloque l'envoi. */
  error?: string;
}

/** Texte visible d'un contenu HTML (Quill). Un éditeur vide donne ''. */
export const plainTextOf = (html: string): string =>
  String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

@Component({
  selector: 'app-rediger-message-direct',
  templateUrl: './rediger-message-direct.component.html',
  styleUrls: ['./rediger-message-direct.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class RedigerMessageDirectComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('templateSearch') templateSearch: ElementRef;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;

  @Select(MessageTemplateState.selectStateData) messageTemplateDataList$: Observable<MessageTemplateModel[]>;
  @Select(MessageTemplateState.selectStateLoading) loadingMessageTemplate$: Observable<boolean>;

  /** Envoi par modèle WhatsApp approuvé (organisation) : seul le média d'en-tête est saisi ici. */
  @Input() cloudTemplateMode = false;
  /** Canal Cloud (membre d'organisation) : une seule pièce jointe, pas de texte + audio. */
  @Input() cloudMode = false;
  @Output() sendMessageData: EventEmitter<ComposedMessage> = new EventEmitter<ComposedMessage>();

  readonly attachmentAccept = ATTACHMENT_ACCEPT;
  readonly attachmentHint = ATTACHMENT_HINT;
  readonly validateAttachments = validateAttachments;

  composeForm: UntypedFormGroup;
  messageTemplateFiltered: MessageTemplateModel[] = [];
  messageTemplateAll: MessageTemplateModel[] = [];
  selectedMessageTemplate: MessageTemplateModel = null;
  selectedFiles: File[] = [];

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private _store: Store,
    private _changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.composeForm = this._formBuilder.group({
      templateSearch: [''],
      body: [''],
      title: ['', [Validators.required]],
    });

    this._store.dispatch(new MessageTemplateAction.FetchAllMessageTemplate());
    this.messageTemplateDataList$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((list: MessageTemplateModel[]) => {
        this.messageTemplateAll = [...(list || [])];
        this._applyTemplateFilter(this.composeForm.controls.templateSearch.value);
      });

    this.composeForm.controls.title.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => this._emit());

    // Le corps est un champ d'edition : chaque modification est transmise (pas seulement au blur).
    this.composeForm.controls.body.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => this._emit());

    this.composeForm.controls.templateSearch.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((query: string) => this._applyTemplateFilter(query));
  }

  ngAfterViewInit(): void {
    this.autocompleteTrigger?.closePanel();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  /** Erreur de canal sur le contenu courant (texte + audio en Cloud...). */
  get channelError(): string {
    const cloud = this.cloudMode || this.cloudTemplateMode;
    if (!cloud) return '';
    const files = this.selectedFiles;
    // En mode modele, le corps est masque : il ne fait pas partie du message envoye.
    const hasText = !this.cloudTemplateMode && plainTextOf(this.composeForm?.controls.body.value).length > 0;
    if (files.length > 1) return "Un message WhatsApp Business ne contient qu'un seul fichier. Envoyez les autres dans des messages séparés.";
    const unsupported = files.map((file) => cloudAttachmentErrorOf(file)).find((error) => !!error);
    if (unsupported) return unsupported;
    if (hasText && files.some((file) => attachmentKindOf(file) === 'audio')) {
      return "WhatsApp n'accepte pas de texte avec un audio : envoyez le texte dans un message séparé.";
    }
    return '';
  }

  /** Pièces jointes : plusieurs fichiers hors Cloud, un seul en Cloud ou pour le média d'en-tête. */
  get allowMultipleFiles(): boolean {
    return !this.cloudMode && !this.cloudTemplateMode;
  }

  get showBody(): boolean {
    return !this.cloudTemplateMode;
  }

  /** Choisir un modèle : son contenu pré-remplit le corps, sans lien avec le modèle ensuite. */
  selectMessageTemplate(template: MessageTemplateModel): void {
    this.selectedMessageTemplate = template;
    this.composeForm.controls.body.setValue(template.content || '');
    this.composeForm.controls.templateSearch.setValue(template.title, { emitEvent: false });
    this._emit();
  }

  removeMessageTemplate(event: Event): void {
    event?.stopPropagation();
    this.selectedMessageTemplate = null;
    this.composeForm.controls.body.setValue('');
    this.composeForm.controls.templateSearch.setValue('');
    this._emit();
  }

  setFiles(files: File[]): void {
    this.selectedFiles = [...files];
    this._emit();
  }

  trackByFn(index: number, item: MessageTemplateModel): string | number {
    return item._id || index;
  }

  private _applyTemplateFilter(query: string): void {
    const normalized = String(query ?? '').trim().toLowerCase();
    this.messageTemplateFiltered = normalized.length < 2
      ? [...this.messageTemplateAll]
      : this.messageTemplateAll.filter((template) => `${template.title}`.toLowerCase().includes(normalized));
    this._changeDetectorRef.markForCheck();
  }

  /** Emet l'état complet du formulaire : une seule source pour le parent. */
  private _emit(): void {
    const text = plainTextOf(this.composeForm.controls.body.value);
    const error = this.channelError;
    this.sendMessageData.emit({
      messageTemplate: null,
      message: text ? this.composeForm.controls.body.value : null,
      files: [...this.selectedFiles],
      title: (this.composeForm.controls.title.value || '').trim(),
      error: error || undefined,
    });
    this._changeDetectorRef.markForCheck();
  }
}
