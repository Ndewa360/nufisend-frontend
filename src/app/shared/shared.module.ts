import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { FuseAlertModule } from '@fuse/components/alert';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatDialogModule} from '@angular/material/dialog'; 
import { FuseLoadingBarModule } from '@fuse/components/loading-bar';
import { MatLuxonDateModule } from '@angular/material-luxon-adapter';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { TranslocoModule } from '@ngneat/transloco';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatTabsModule } from '@angular/material/tabs';

const moduleList = [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatSortModule,
    FuseAlertModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    FuseLoadingBarModule,
    MatButtonModule,
    MatDividerModule,
    MatLuxonDateModule,
    MatRadioModule,
    MatSidenavModule,
    FuseFindByKeyPipeModule,
    MatButtonToggleModule,
    MatTabsModule,
    NgApexchartsModule,
    TranslocoModule,
    
]
@NgModule({
    imports: [
        ...moduleList
    ],
    exports: [
        ...moduleList
    ]
})
export class SharedModule
{
}
