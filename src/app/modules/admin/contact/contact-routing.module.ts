import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { AddComponent } from './add/add.component';
import { CountriesResolver } from 'app/shared/store';
import { CanDeactivateContactImport, CanDeactivateContactsAdd, CanDeactivateContactsDetail } from './contacts.guards';
import { DetailComponent } from './detail/detail.component';
import { ContactResolver } from 'app/shared/store/contact';
import { ImportComponent } from './import/import.component';

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
        path     : "import",
        pathMatch:'full',
        component: ImportComponent,
        resolve: {
          countries: CountriesResolver
        },
        canDeactivate: [CanDeactivateContactImport]
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
