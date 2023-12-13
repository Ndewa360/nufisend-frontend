import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { AddComponent } from './add/add.component';
import { CountriesResolver } from 'app/shared/store';
import { CanDeactivateContactsAdd, CanDeactivateContactsDetail } from './contacts.guards';
import { DetailComponent } from './detail/detail.component';
import { ContactResolver } from 'app/shared/store/contact';

const routes: Routes = [  
  {
    path     : '',
    component: ListComponent,    
    children : [
      {
        path     : "new",
        pathMatch:'full',
        component: AddComponent,
        resolve: {
          countries: CountriesResolver
        },
        canDeactivate: [CanDeactivateContactsAdd]
      },
      {
        path     : ':id',
        pathMatch:'full',
        component: DetailComponent,
        resolve: {
          countries: CountriesResolver,
          task: ContactResolver
        },
        canDeactivate: [CanDeactivateContactsDetail]
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactRoutingModule { }
