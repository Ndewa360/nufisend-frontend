import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Etat d'une occurrence : lancee, non lancee alors qu'elle devait l'etre, prevue, ou non envoyee. */
export type OccurrenceState = 'launched' | 'missed' | 'upcoming' | 'not_sent' | 'unknown';

export interface DayTimeSlot {
  time: string;
  state: OccurrenceState;
}

/** Planification ayant au moins une occurrence le jour affiche. */
export interface DayPlanificationEntry {
  _id: string;
  title: string;
  status: { label: string; tone: 'ok' | 'warn' | 'muted' };
  /** Heures de ce jour uniquement (HH:mm). */
  times: DayTimeSlot[];
}

@Component({
  selector: 'app-schedule-list-day',
  templateUrl: './schedule-list-day.component.html',
  styleUrls: ['./schedule-list-day.component.scss']
})
export class ScheduleListDayComponent {

  @Input() entries: DayPlanificationEntry[] = [];
  @Input() loading = false;
  @Input() loadError = false;
  @Input() dayLabel = '';
  @Output() retry = new EventEmitter<void>();

  readonly toneClasses: Record<DayPlanificationEntry['status']['tone'], string> = {
    ok: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30',
    warn: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30',
    muted: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/40',
  };

  readonly stateLabels: Record<OccurrenceState, string> = {
    launched: 'Lancé',
    missed: 'Non lancé',
    upcoming: 'Prévu',
    not_sent: 'Non envoyé',
    unknown: 'Historique indisponible',
  };

  readonly stateClasses: Record<OccurrenceState, string> = {
    launched: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30',
    missed: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30',
    upcoming: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30',
    not_sent: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/40',
    unknown: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/40',
  };
}
