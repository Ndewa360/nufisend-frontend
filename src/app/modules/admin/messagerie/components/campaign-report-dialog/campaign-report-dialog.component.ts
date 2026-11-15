import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { CampaignReport, CampaignStatsService, ErrorCode } from 'app/shared/store/message';
import { CsvColumn, downloadCsv, toCsv } from 'app/shared/utils/csv-export';

export interface CampaignReportDialogData {
  messageId: string;
}

/** Libelles lisibles des statuts de destinataire. */
const RECIPIENT_STATUS_LABELS: Record<string, string> = {
  delivered: 'Livré',
  read: 'Lu',
  unconfirmed: 'Sans accusé',
  failed: 'Échec',
  sent: 'Envoyé',
  unknown: 'Inconnu',
};

/** Libelles des statuts d'une occurrence. */
const RUN_STATUS_LABELS: Record<string, string> = {
  started: 'En cours',
  done: 'Terminée',
  partial: 'Partielle',
  failed: 'Échec',
  cancelled: 'Arrêtée',
};

/**
 * Rapport d'une campagne : totaux, erreurs groupees, destinataires (numeros masques),
 * cout, chronologie et occurrences. Export CSV des destinataires.
 */
@Component({
  selector: 'app-campaign-report-dialog',
  templateUrl: './campaign-report-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignReportDialogComponent implements OnInit, OnDestroy {
  report: CampaignReport | null = null;
  loading = true;
  error = false;
  readonly recipientColumns = ['name', 'phone', 'status', 'error'];
  private _unsubscribeAll = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<CampaignReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CampaignReportDialogData,
    private _statistics: CampaignStatsService,
    private _cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this._cdr.markForCheck();
    this._statistics.report(this.data.messageId).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this._cdr.markForCheck();
      },
    });
  }

  recipientStatusLabel(status: string): string {
    return RECIPIENT_STATUS_LABELS[status] || status;
  }

  runStatusLabel(status: string): string {
    return RUN_STATUS_LABELS[status] || status;
  }

  errorIcon(code: ErrorCode | null): string {
    return code === 'BALANCE' || code === 'SESSION_LOST' ? 'text-amber-600' : 'text-red-600';
  }

  /** Telecharge le detail des destinataires (numeros masques). */
  exportRecipients(): void {
    if (!this.report) return;
    const columns: CsvColumn<any>[] = [
      { key: 'name', label: 'Nom' },
      { key: 'phone', label: 'Numéro (masqué)' },
      { key: 'status', label: 'Statut', format: (row) => this.recipientStatusLabel(row.status) },
      { key: 'errorLabel', label: 'Erreur' },
    ];
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`campagne-${stamp}.csv`, toCsv(this.report.recipients, columns));
  }
}
