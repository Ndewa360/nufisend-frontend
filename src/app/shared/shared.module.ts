import { NgModule, forwardRef } from '@angular/core';
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
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatDialogModule} from '@angular/material/dialog'; 
import { FuseLoadingBarModule } from '@fuse/components/loading-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { TranslocoModule } from '@ngneat/transloco';
import { MatTabsModule } from '@angular/material/tabs';
import {MatAutocompleteModule} from '@angular/material/autocomplete';

import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { WhatsappAskSyncToatrComponent } from './components/whatsapp-ask-sync-toatr/whatsapp-ask-sync-toatr.component'; 
import { SyncQrcodeService } from './services/whatsapp/sync-qrcode.service';
import { WebsocketManagerService } from './services/websocket-manager/websocket-manager.service';
import {MatCardModule} from '@angular/material/card';
// import { CalendarModule } from 'primeng/calendar';
// import { DropzoneModule } from 'ngx-dropzone-wrapper';
// import { DROPZONE_CONFIG } from 'ngx-dropzone-wrapper';
// import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';

// const DEFAULT_DROPZONE_CONFIG: DropzoneConfigInterface = {
//  // Change this to your upload POST address:
//   url: '/api/upload',
//   maxFilesize: 50,
//   acceptedFiles: 'image/*'
// };


const moduleList = [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
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
    MatRadioModule,
    MatSidenavModule,
    FuseFindByKeyPipeModule,
    MatButtonToggleModule,
    MatTabsModule,
    TranslocoModule,
    MatAutocompleteModule,
    MatCardModule,
    MatButtonToggleModule,

    // CalendarModule
    // DropzoneModule
]
@NgModule({
    imports: [
        ...moduleList,
    ],
    exports: [
        ...moduleList,
        FileUploadComponent,
      WhatsappAskSyncToatrComponent
    ],
    declarations: [
      FileUploadComponent,
      WhatsappAskSyncToatrComponent
    ],
    providers: [
        // WebsocketManagerService,
       
      ]
})
export class SharedModule
{
}
