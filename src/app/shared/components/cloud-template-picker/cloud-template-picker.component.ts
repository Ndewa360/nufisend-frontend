import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { OrganizationService } from 'app/core/organization/organization.service';
import {
    TEMPLATE_CATEGORY_LABELS,
    TemplateRef,
    WhatsappTemplate,
    templateBody,
} from 'app/core/organization/organization.types';

export interface TemplateSelection
{
    template: TemplateRef | null;
    /** Categorie Meta (tarif) : `service` pour un message libre. */
    category: string;
    /** Texte du modele (apercu). */
    preview: string;
    /** Vrai si toutes les variables et le media d'en-tete requis sont renseignes. */
    complete: boolean;
}

const MEDIA_HEADERS = ['IMAGE', 'VIDEO', 'DOCUMENT'];

/**
 * Choix d'un modele WhatsApp approuve par Meta et de ses variables, pour les
 * envois des membres d'une organisation (API WhatsApp Cloud).
 */
@Component({
    selector       : 'app-cloud-template-picker',
    standalone     : true,
    imports        : [CommonModule, FormsModule, RouterModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div *ngIf="loading" class="flex items-center gap-2 text-secondary text-sm py-2">
            <mat-progress-spinner [diameter]="18" mode="indeterminate"></mat-progress-spinner> Chargement des modèles…
        </div>
        <ng-container *ngIf="!loading">
            <div *ngIf="!templates.length" class="text-sm text-secondary py-2">
                Aucun modèle approuvé par Meta.
                <a class="text-primary underline" routerLink="/organisation/whatsapp">Gérer les modèles</a>
            </div>
            <ng-container *ngIf="templates.length">
                <mat-form-field class="w-full" appearance="outline" subscriptSizing="dynamic">
                    <mat-label>Modèle WhatsApp</mat-label>
                    <mat-select [(ngModel)]="selectedKey" (ngModelChange)="onSelect()">
                        <mat-option *ngIf="allowFreeText" [value]="''">— Message libre (clients ayant écrit dans les 24 h) —</mat-option>
                        <mat-option *ngFor="let template of templates" [value]="keyOf(template)">
                            {{ template.name }} · {{ template.language }} · {{ categoryLabels[(template.category || '').toLowerCase()] || template.category }}
                        </mat-option>
                    </mat-select>
                </mat-form-field>

                <ng-container *ngIf="selected">
                    <div class="mt-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-sm whitespace-pre-line">{{ previewText }}</div>
                    <div *ngIf="variables.length" class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <mat-form-field *ngFor="let value of variables; let i = index; trackBy: trackByIndex" appearance="outline" subscriptSizing="dynamic">
                            <mat-label>{{ '{{' + (i + 1) + '}}' }}</mat-label>
                            <input matInput [(ngModel)]="variables[i]" (ngModelChange)="emit()" [placeholder]="'Ex. : {{receiverFullName}}'">
                        </mat-form-field>
                    </div>
                    <div *ngIf="variables.length" class="text-xs text-secondary mt-1">
                        Personnalisation : {{ '{{receiverFullName}}' }} (nom du destinataire), {{ '{{senderFullName}}' }} (votre nom).
                    </div>
                    <mat-form-field *ngIf="needsHeaderMedia" class="w-full mt-3" appearance="outline" subscriptSizing="dynamic">
                        <mat-label>Lien public du média d'en-tête ({{ selected.headerFormat | lowercase }})</mat-label>
                        <input matInput [(ngModel)]="headerMediaUrl" (ngModelChange)="emit()" placeholder="https://…">
                        <mat-hint>Ou joignez le fichier au message.</mat-hint>
                    </mat-form-field>
                </ng-container>
            </ng-container>
        </ng-container>
    `,
})
export class CloudTemplatePickerComponent implements OnInit
{
    /** Autorise le message libre (envoi immediat, reponse dans la fenetre de 24 h). */
    @Input() allowFreeText = true;
    /** Un fichier joint au message sert de media d'en-tete. */
    @Input() hasAttachment = false;
    @Output() selectionChange = new EventEmitter<TemplateSelection>();

    templates: WhatsappTemplate[] = [];
    loading = true;
    selectedKey = '';
    selected: WhatsappTemplate | null = null;
    variables: string[] = [];
    headerMediaUrl = '';

    readonly categoryLabels = TEMPLATE_CATEGORY_LABELS;

    constructor(private _organizationService: OrganizationService, private _cdr: ChangeDetectorRef) {}

    ngOnInit(): void
    {
        this._organizationService.templates(true).subscribe({
            next : (templates) => {
                this.templates = templates;
                this.loading = false;
                if (!this.allowFreeText && templates.length) {
                    this.selectedKey = this.keyOf(templates[0]);
                    this.onSelect();
                } else {
                    this.emit();
                }
                this._cdr.markForCheck();
            },
            error: () => {
                this.loading = false;
                this.emit();
                this._cdr.markForCheck();
            },
        });
    }

    get needsHeaderMedia(): boolean
    {
        return !!this.selected && MEDIA_HEADERS.includes(String(this.selected.headerFormat || '')) && !this.hasAttachment;
    }

    get previewText(): string
    {
        return templateBody(this.selected).replace(/\{\{\s*(\d+)\s*\}\}/g, (match, index) => this.variables[Number(index) - 1] || match);
    }

    keyOf(template: WhatsappTemplate): string
    {
        return `${template.name}|${template.language}`;
    }

    trackByIndex(index: number): number
    {
        return index;
    }

    onSelect(): void
    {
        this.selected = this.templates.find((template) => this.keyOf(template) === this.selectedKey) || null;
        this.variables = Array.from({ length: this.selected?.bodyVariables || 0 }, () => '');
        this.headerMediaUrl = '';
        this.emit();
    }

    emit(): void
    {
        if (!this.selected) {
            this.selectionChange.emit({
                template: null,
                category: 'service',
                preview : '',
                complete: this.allowFreeText,
            });
            return;
        }
        const complete = this.variables.every((value) => !!value.trim())
            && (!this.needsHeaderMedia || /^https?:\/\//.test(this.headerMediaUrl.trim()));
        this.selectionChange.emit({
            template: {
                name     : this.selected.name,
                language : this.selected.language,
                variables: this.variables.map((value) => value.trim()),
                ...(this.needsHeaderMedia && this.headerMediaUrl.trim() ? { headerMediaUrl: this.headerMediaUrl.trim() } : {}),
            },
            category: String(this.selected.category || 'marketing').toLowerCase(),
            preview : this.previewText,
            complete,
        });
    }
}
