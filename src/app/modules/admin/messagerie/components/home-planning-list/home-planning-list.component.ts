import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Actions, Select, Store, ofActionCompleted } from '@ngxs/store';
import { ContactModel, ContactState, GroupModel, GroupState, MessageStatus } from 'app/shared/store';
import { PlanificationAction, PlanificationModel, PlanificationState } from 'app/shared/store/planifcation';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Observable, Subject, combineLatest, takeUntil } from 'rxjs';

/** Ligne du tableau : une planification avec ses destinataires et son etat, calcules une seule fois. */
export interface PlanningRow {
  plan: PlanificationModel;
  recipients: string;
  recipientCount: number;
  groupCount: number;
  status: { label: string; tone: 'ok' | 'warn' | 'muted' | 'info' };
  /** Une campagne de cette planification est en cours (pause ou envoi) : pas de modification. */
  running: boolean;
  canEnable: boolean;
}

/** Tableau des planifications : etat par ligne, pas de menu partage entre les lignes. */
@Component({
  selector: 'app-home-planning-list',
  templateUrl: './home-planning-list.component.html',
  styleUrls: ['./home-planning-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomePlanningListComponent implements OnInit, OnDestroy {
  @Select(PlanificationState.selectStateData) planificationList$: Observable<PlanificationModel[]>;
  @Select(PlanificationState.selectStateLoading) loading$: Observable<boolean>;
  @Select(PlanificationState.selectStateLoadError) loadError$: Observable<boolean>;
  @Select(ContactState.selectStateData) contacts$: Observable<ContactModel[]>;
  @Select(GroupState.selectStateData) groups$: Observable<GroupModel[]>;

  readonly columns = ['titre', 'destinataires', 'statut', 'action'];
  rows: PlanningRow[] = [];
  loadError = false;
  loading = false;
  /** Planifications dont une action est en cours (la ligne seule est desactivee). */
  busy = new Set<string>();

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private _store: Store,
    private _ngxsAction: Actions,
    private _fuseConfirmationService: FuseConfirmationService,
  ) {}

  ngOnInit(): void {
    combineLatest([this.planificationList$, this.contacts$, this.groups$])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(([plans, contacts, groups]) => {
        this.rows = this._buildRows(plans || [], contacts || [], groups || []);
      });

    this.loading$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => (this.loading = !!value));
    this.loadError$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => (this.loadError = !!value));

    // Fin d'action (succes ou echec) : la ligne redevient utilisable.
    this._ngxsAction
      .pipe(takeUntil(this._unsubscribeAll), ofActionCompleted(PlanificationAction.UpdatePlanification))
      .subscribe((result: any) => this.busy.delete(result?.action?.id));
    this._ngxsAction
      .pipe(takeUntil(this._unsubscribeAll), ofActionCompleted(PlanificationAction.DeletePlanification))
      .subscribe((result: any) => this.busy.delete(result?.action?.id));
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  retry(): void {
    this._store.dispatch(new PlanificationAction.FetchAllPlanification(true));
  }

  trackById(_: number, row: PlanningRow): string {
    return row.plan._id;
  }

  /** Desactive une planification active, ou reactive une planification non terminee. */
  toggle(row: PlanningRow): void {
    const id = row.plan._id;
    if (row.running || this.busy.has(id)) return;
    if (row.plan.isActive) {
      this.busy.add(id);
      this._store.dispatch(new PlanificationAction.UpdatePlanification({ isActive: false }, id));
      return;
    }
    if (!row.canEnable) return;
    this.busy.add(id);
    this._store.dispatch(new PlanificationAction.UpdatePlanification({ isActive: true }, id));
  }

  deletePlaning(row: PlanningRow): void {
    if (row.running || this.busy.has(row.plan._id)) return;
    this._fuseConfirmationService.open({
      title: 'Supprimer la planification',
      message: 'Voulez-vous vraiment supprimer cette planification ? Cette action est irréversible.',
      actions: { confirm: { label: 'Supprimer' }, cancel: { label: 'Annuler' } },
    }).afterClosed().subscribe((result) => {
      if (result === 'confirmed') {
        this.busy.add(row.plan._id);
        this._store.dispatch(new PlanificationAction.DeletePlanification(row.plan._id));
      }
    });
  }

  getStatusLabel(status: MessageStatus): string {
    switch (status) {
      case MessageStatus.SENT: return 'Envoyé';
      case MessageStatus.PARTIAL: return 'Partiel';
      case MessageStatus.FAILED: return 'Échec';
      case MessageStatus.PENDING: return 'En attente';
      case MessageStatus.PAUSED: return 'En pause';
      case MessageStatus.SCHEDULED: return 'Programmé';
      default: return 'Programmé';
    }
  }

  private _buildRows(plans: PlanificationModel[], contacts: ContactModel[], groups: GroupModel[]): PlanningRow[] {
    const contactNames = new Map(contacts.map((contact) => [String(contact._id), contact.fullName || '']));
    const groupNames = new Map(groups.map((group) => [String(group._id), group.name || '']));

    return plans.map((plan) => {
      const message: any = plan.message || {};
      const contactIds: string[] = (message.contacts || []).map((item: any) => String(item?._id ?? item));
      const groupIds: string[] = (message.groups || []).map((item: any) => String(item?._id ?? item));
      const names = contactIds.map((id) => contactNames.get(id)).filter((name): name is string => !!name);
      const shown = names.slice(0, 2).join(', ');
      const more = names.length > 2 ? ` +${names.length - 2}` : '';
      const running = message.dispatch?.state === 'running' || message.dispatch?.state === 'paused';
      const billingSuspended = !!plan.billingStatus && plan.billingStatus !== 'ok';
      const exhausted = !!plan.isExhausted;

      let status: PlanningRow['status'];
      if (!plan.isActive) status = { label: 'Désactivée', tone: 'muted' };
      else if (billingSuspended) status = { label: 'Suspendue : solde insuffisant', tone: 'warn' };
      else if (exhausted) status = { label: 'Terminée', tone: 'muted' };
      else if (message.dispatch?.state === 'running') status = { label: 'Envoi en cours', tone: 'info' };
      else if (message.dispatch?.state === 'paused') status = { label: 'En pause', tone: 'warn' };
      else status = { label: 'Active', tone: 'ok' };

      return {
        plan,
        recipients: shown ? `${shown}${more}` : contactIds.length ? `${contactIds.length} contact(s)` : '',
        recipientCount: contactIds.length + (message.phoneRecipients?.length || 0),
        groupCount: groupIds.length,
        status,
        running,
        canEnable: !exhausted && !billingSuspended,
      };
    });
  }
}
