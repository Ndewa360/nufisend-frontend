import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { AddComponent } from './add/add.component';
import { CanDeactivateMessageTemplatesAdd, CanDeactivateMessageTemplatesDetail } from './message-template.guards';
import { DetailComponent } from './detail/detail.component';
import { MessageTemplateResolver } from 'app/shared/store';

const routes: Routes = [
  {
    path     : '',
    component: ListComponent,    
    // canDeactivate: [CanDeactivateContactsAdd]
    children:[
      {
        path     : "new",
        pathMatch:'full',
        component: AddComponent,
        resolve: {
        },
        canDeactivate: [CanDeactivateMessageTemplatesAdd]
      },
      {
        path     : ':id',
        pathMatch:'full',
        resolve: {
          messageTemplateResolver:MessageTemplateResolver
        },
        component: DetailComponent,

        canDeactivate: [CanDeactivateMessageTemplatesDetail]
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MessageTemplateRoutingModule { }
