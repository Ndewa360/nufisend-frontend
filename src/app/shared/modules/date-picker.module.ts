import { NgModule } from '@angular/core';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

/** Formats Moment utilises par tous les selecteurs de date de l'application. */
export const APP_DATE_FORMATS = {
    parse: {
        dateInput: ['DD/MM/YYYY', 'D/M/YYYY', 'L'],
    },
    display: {
        dateInput         : 'DD/MM/YYYY',
        monthYearLabel    : 'MMM YYYY',
        dateA11yLabel     : 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};

/**
 * Selecteurs de date et d'heure (adaptateur Moment). Charge uniquement par les
 * modules qui en ont besoin : Moment et ses locales pesaient ~650 Ko dans le
 * bundle initial lorsqu'ils etaient importes par le SharedModule.
 */
@NgModule({
    imports: [MatDatepickerModule, MatMomentDateModule, NgxMaterialTimepickerModule],
    exports: [MatDatepickerModule, MatMomentDateModule, NgxMaterialTimepickerModule],
    providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'fr' },
        { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    ],
})
export class DatePickerModule
{
}
