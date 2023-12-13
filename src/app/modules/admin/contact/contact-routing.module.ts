import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { AddComponent } from './add/add.component';
import { CountriesResolver } from 'app/shared/store';
import { CanDeactivateContactsAdd } from './contacts.guards';

const routes: Routes = [  
  {
    path     : '',
    component: ListComponent,    
    children : [
      {
        path     : 'new',
        component: AddComponent,
        resolve: {
          countries: CountriesResolver
        },
        canDeactivate: [CanDeactivateContactsAdd]
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactRoutingModule { }
