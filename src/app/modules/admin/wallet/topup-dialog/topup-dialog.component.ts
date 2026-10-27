import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { WalletService } from 'app/core/wallet/wallet.service';
import { Payment, PaymentOperator, WalletSummary } from 'app/core/wallet/wallet.types';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';

const POLL_INTERVAL_MS = 4000;
/** Au-dela, on cesse le suivi en direct (le backend continue de verifier). */
const POLL_MAX_MS = 5 * 60_000;

@Component({
    selector       : 'app-topup-dialog',
    templateUrl    : './topup-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopupDialogComponent implements OnDestroy
{
    readonly presets = [1000, 2000, 5000, 10000, 25000];
    readonly form = this._fb.group({
        amount  : [5000, [Validators.required, Validators.min(this.data.summary.minTopup), Validators.max(this.data.summary.maxTopup)]],
        operator: ['MTN' as PaymentOperator, Validators.required],
        phone   : ['', [Validators.required, Validators.pattern(/^(\+?237)?\s?6[\d\s]{8,11}$/)]],
    });

    step: 'form' | 'waiting' | 'done' = 'form';
    submitting = false;
    error = '';
    payment: Payment | null = null;
    pollingStopped = false;
    private _poll?: Subscription;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { summary: WalletSummary },
        private _dialogRef: MatDialogRef<TopupDialogComponent>,
        private _fb: FormBuilder,
        private _walletService: WalletService,
        private _cdr: ChangeDetectorRef,
    ) {}

    get amount(): number
    {
        return Number(this.form.value.amount) || 0;
    }

    setAmount(amount: number): void
    {
        this.form.patchValue({ amount });
    }

    /** Prefixe camerounais : 67/650-654/68 -> MTN, 69/655-659 -> Orange. */
    detectOperator(): void
    {
        const digits = String(this.form.value.phone || '').replace(/\D/g, '').replace(/^237/, '');
        if (/^(67|65[0-4]|68)/.test(digits)) this.form.patchValue({ operator: 'MTN' });
        else if (/^(69|65[5-9])/.test(digits)) this.form.patchValue({ operator: 'ORANGE' });
    }

    submit(): void
    {
        if (this.form.invalid || this.submitting) {
            this.form.markAllAsTouched();
            return;
        }
        this.submitting = true;
        this.error = '';
        const { amount, phone, operator } = this.form.getRawValue();
        this._walletService.topup(Number(amount), String(phone), operator as PaymentOperator).subscribe({
            next : (payment) => {
                this.submitting = false;
                this.payment = payment;
                if (payment.status === 'pending') {
                    this.step = 'waiting';
                    this._startPolling(payment.reference);
                } else {
                    this.step = 'done';
                }
                this._cdr.markForCheck();
            },
            error: (err) => {
                this.submitting = false;
                const message = err?.error?.message;
                this.error = Array.isArray(message) ? message.join(' ') : message || 'La recharge n’a pas pu être initiée.';
                this._cdr.markForCheck();
            },
        });
    }

    private _startPolling(reference: string): void
    {
        const startedAt = Date.now();
        this._poll?.unsubscribe();
        this._poll = interval(POLL_INTERVAL_MS)
            .pipe(
                switchMap(() => this._walletService.topupStatus(reference)),
                takeWhile((payment) => payment.status === 'pending' && Date.now() - startedAt < POLL_MAX_MS, true),
            )
            .subscribe({
                next    : (payment) => {
                    this.payment = payment;
                    if (payment.status !== 'pending') this.step = 'done';
                    this._cdr.markForCheck();
                },
                complete: () => {
                    if (this.payment?.status === 'pending') this.pollingStopped = true;
                    this._cdr.markForCheck();
                },
            });
    }

    close(): void
    {
        this._dialogRef.close(this.payment);
    }

    ngOnDestroy(): void
    {
        this._poll?.unsubscribe();
    }
}
