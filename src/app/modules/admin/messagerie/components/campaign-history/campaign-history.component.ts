import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Actions, ofActionSuccessful } from '@ngxs/store';
import { EMPTY, Observable, Subject, Subscription, catchError, expand, map, reduce, takeUntil } from 'rxjs';
import { CampaignChannel, CampaignHistoryItem, CampaignKind, CampaignStatsService, HistoryParams, MessageAction, Paginated } from 'app/shared/store/message';
import { CsvColumn, downloadCsv, toCsv } from 'app/shared/utils/csv-export';
import { CampaignReportDialogComponent, CampaignReportDialogData } from '../campaign-report-dialog/campaign-report-dialog.component';

/** Periodes du filtre (jours) ; 0 = toutes. */
export const HISTORY_PERIODS = [
  { days: 7, label: '7 jours' },
  { days: 30, label: '30 jours' },
  { days: 90, label: '90 jours' },
  { days: 365, label: '12 mois' },
  { days: 0, label: 'Tout' },
] as const;

/** Statuts proposes dans le filtre (valeurs de l'API). */
export const HISTORY_STATUSES = [
  { value: '', label: 'Tous les statuts' },
  { value: 'sent', label: 'Envoyé' },
  { value: 'partial', label: 'Partiel' },
  { value: 'failed', label: 'Échec' },
  { value: 'pending', label: 'En attente' },
  { value: 'scheduled', label: 'Programmé' },
  { value: 'paused', label: 'En pause' },
] as const;

const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_ROWS = 1000;

/**
 * Historique des campagnes : filtres, tableau pagine cote serveur, rapport au clic,
 * export CSV des resultats filtres.
 */
@Component({
  selector: 'app-campaign-history',
  templateUrl: './campaign-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignHistoryComponent implements OnInit, OnDestroy {
  readonly periods = HISTORY_PERIODS;
  readonly statuses = HISTORY_STATUSES;
  readonly columns = ['title', 'createdAt', 'channel', 'kind', 'status', 'total', 'rate', 'failed', 'cost', 'action'];

  periodDays = 30;
  status = '';
  channel: CampaignChannel | '' = '';
  kind: CampaignKind | '' = '';
  search = '';

  rows: CampaignHistoryItem[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  error = false;
  exporting = false;

  private _request: Subscription;
  private _searchTimer: ReturnType<typeof setTimeout> | null = null;
  private _unsubscribeAll = new Subject<void>();

  constructor(
    private _statistics: CampaignStatsService,
    private _dialog: MatDialog,
    private _actions: Actions,
    private _cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
    // Un envoi reussi apparait tout de suite dans l'historique.
    this._actions
      .pipe(takeUntil(this._unsubscribeAll), ofActionSuccessful(MessageAction.SendMessage))
      .subscribe(() => {
        this.page = 1;
        this.load();
      });
  }

  ngOnDestroy(): void {
    this._request?.unsubscribe();
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  /** Parametres de requete courants (filtres + pagination). */
  private _params(page: number, limit: number): HistoryParams {
    const to = new Date();
    const from = this.periodDays ? new Date(to.getTime() - this.periodDays * 86400000) : null;
    return {
      from,
      to: this.periodDays ? to : null,
      status: this.status || null,
      channel: this.channel || null,
      kind: this.kind || null,
      q: this.search || null,
      page,
      limit,
    };
  }

  load(): void {
    this._request?.unsubscribe();
    this.loading = true;
    this.error = false;
    this._cdr.markForCheck();
    this._request = this._statistics.history(this._params(this.page, this.pageSize)).subscribe({
      next: (response: Paginated<CampaignHistoryItem>) => {
        this.rows = response.data;
        this.total = response.total;
        this.loading = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.rows = [];
        this.total = 0;
        this.loading = false;
        this.error = true;
        this._cdr.markForCheck();
      },
    });
  }

  /** Changement de filtre : retour a la premiere page. */
  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  /** Recherche par titre, avec un delai pour ne pas interroger a chaque frappe. */
  onSearchChange(): void {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.applyFilters(), 350);
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.load();
  }

  open(row: CampaignHistoryItem): void {
    this._dialog.open<CampaignReportDialogComponent, CampaignReportDialogData>(CampaignReportDialogComponent, {
      data: { messageId: row._id },
      width: '720px',
      maxWidth: '96vw',
      autoFocus: false,
    });
  }

  /** Exporte toutes les lignes filtrees (jusqu'a 1000), pas seulement la page affichee. */
  exportCsv(): void {
    if (this.exporting) return;
    this.exporting = true;
    this._cdr.markForCheck();
    this._allMatching()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (rows) => {
          const columns: CsvColumn<CampaignHistoryItem>[] = [
            { key: 'title', label: 'Titre' },
            { key: 'createdAt', label: 'Créée le', format: (row) => new Date(row.createdAt).toLocaleString('fr-FR') },
            { key: 'channel', label: 'Canal', format: (row) => (row.channel === 'cloud' ? 'WhatsApp Business' : 'WhatsApp Web') },
            { key: 'kind', label: 'Type', format: (row) => (row.kind === 'scheduled' ? 'Programmée' : 'Immédiate') },
            { key: 'statusLabel', label: 'Statut' },
            { key: 'total', label: 'Destinataires' },
            { key: 'delivered', label: 'Livrés' },
            { key: 'unconfirmed', label: 'Sans accusé' },
            { key: 'failed', label: 'Échecs' },
            { key: 'acceptanceRate', label: "Taux d'acceptation (%)" },
            { key: 'cost', label: 'Coût (FCFA)' },
          ];
          downloadCsv(`campagnes-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, columns));
          this.exporting = false;
          this._cdr.markForCheck();
        },
        error: () => {
          this.exporting = false;
          this._cdr.markForCheck();
        },
      });
  }

  /** Toutes les pages du filtre courant, bornees a EXPORT_MAX_ROWS. */
  private _allMatching(): Observable<CampaignHistoryItem[]> {
    const fetch = (page: number) => this._statistics.history(this._params(page, EXPORT_PAGE_SIZE));
    return fetch(1).pipe(
      expand((response) => (response.page < response.pages && response.data.length * response.page < EXPORT_MAX_ROWS ? fetch(response.page + 1) : EMPTY)),
      reduce((all: CampaignHistoryItem[], response) => all.concat(response.data), [] as CampaignHistoryItem[]),
      map((rows) => rows.slice(0, EXPORT_MAX_ROWS)),
      catchError(() => {
        this.exporting = false;
        return EMPTY;
      }),
    );
  }
}
