import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Directive, OnInit } from '@angular/core';
import { LEGAL_INFO } from 'app/core/legal/legal.config';
import {
    LegalDocumentId,
    LegalDocumentsInfo,
    LegalService,
    PRIVACY_REQUEST_LABELS,
    PrivacyRequestType,
} from 'app/core/legal/legal.service';

/** Donnees communes des pages legales : versions et durees du backend. */
@Directive()
export abstract class LegalPageBase implements OnInit
{
    readonly info = LEGAL_INFO;
    documents: LegalDocumentsInfo | null = null;

    constructor(protected _legalService: LegalService, protected _cdr: ChangeDetectorRef) {}

    ngOnInit(): void
    {
        this._legalService.documents().subscribe({
            next : (documents) => {
                this.documents = documents;
                this._cdr.markForCheck();
            },
            error: () => undefined,
        });
    }

    version(document: LegalDocumentId): string
    {
        return this.documents?.documents.find((d) => d.document === document)?.version || '—';
    }

    get responseDelay(): number
    {
        return this.documents?.responseDelayDays ?? 30;
    }

    /** Duree de conservation lisible ("12 mois", "90 jours"). */
    days(key: string): string
    {
        const value = this.documents?.retention?.[key];
        if (!value) return 'la durée indiquée dans nos réglages';
        if (value % 365 === 0) return value === 365 ? '12 mois' : `${value / 365} ans`;
        if (value % 30 === 0 && value >= 60) return `${value / 30} mois`;
        return `${value} jours`;
    }
}

@Component({ selector: 'app-legal-notice', templateUrl: './legal-notice.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class LegalNoticeComponent extends LegalPageBase {}

@Component({ selector: 'app-privacy-policy', templateUrl: './privacy-policy.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class PrivacyPolicyComponent extends LegalPageBase {}

@Component({ selector: 'app-terms', templateUrl: './terms.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class TermsComponent extends LegalPageBase {}

@Component({ selector: 'app-cookies', templateUrl: './cookies.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class CookiesComponent extends LegalPageBase {}

@Component({ selector: 'app-processing-agreement', templateUrl: './processing-agreement.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ProcessingAgreementComponent extends LegalPageBase {}

@Component({ selector: 'app-exercise-rights', templateUrl: './exercise-rights.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ExerciseRightsComponent extends LegalPageBase
{
    readonly labels = PRIVACY_REQUEST_LABELS;
    readonly types: PrivacyRequestType[] = ['opposition', 'erasure', 'access', 'rectification', 'limitation', 'withdraw_consent', 'other'];
    form = { fullName: '', email: '', phone: '', type: 'opposition' as PrivacyRequestType, message: '', website: '' };
    sending = false;
    error = '';
    submitted: { reference: string; dueAt: string } | null = null;

    submit(): void
    {
        this.sending = true;
        this.error = '';
        this._legalService.publicRequest({
            fullName: this.form.fullName.trim(),
            email   : this.form.email.trim(),
            phone   : this.form.phone.trim() || undefined,
            type    : this.form.type,
            message : this.form.message.trim(),
            website : this.form.website || undefined,
        }).subscribe({
            next : (result) => {
                this.sending = false;
                this.submitted = result;
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.sending = false;
                const message = error?.error?.message;
                this.error = error?.status === 429
                    ? 'Trop de demandes envoyées : réessayez dans quelques minutes ou écrivez-nous par email.'
                    : Array.isArray(message) ? message.join(' ') : message || 'La demande n’a pas pu être envoyée.';
                this._cdr.markForCheck();
            },
        });
    }
}
