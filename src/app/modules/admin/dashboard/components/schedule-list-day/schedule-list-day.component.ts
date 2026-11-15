import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Planification ayant au moins une occurrence le jour affiche. */
export interface DayPlanificationEntry {
  _id: string;
  title: string;
  status: { label: string; tone: 'ok' | 'warn' | 'muted' };
  /** Heures de ce jour uniquement (HH:mm), avec l'indication "deja passee". */
  times: { time: string; past: boolean }[];
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
  @Output() retry = new EventEmitter<void>();

  readonly toneClasses: Record<DayPlanificationEntry['status']['tone'], string> = {
    ok: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30',
    warn: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30',
    muted: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/40',
  };
}
