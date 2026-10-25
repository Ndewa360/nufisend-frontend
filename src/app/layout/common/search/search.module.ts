import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { FuseAnimationsModule } from '@fuse/animations';
import { SearchComponent } from './search.component';

@NgModule({
    declarations: [SearchComponent],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatOptionModule,
        FuseAnimationsModule,
    ],
    exports: [SearchComponent]
})
export class SearchModule {}
