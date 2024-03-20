import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { AddComponent } from './add/add.component';
import { CanDeactivateGroupsAdd, CanDeactivateGroupsDetail } from './group.guards';
import { GroupResolver } from 'app/shared/store';
import { DetailComponent } from './detail/detail.component';

const routes: Routes = [
  {
    path     : '',
    component: ListComponent,  
    children : [
      {
        path     : "new",
        pathMatch:'full',
        component: AddComponent,
        canDeactivate: [CanDeactivateGroupsAdd]
      },
      {
        path     : ':id',
        pathMatch:'full',
        component: DetailComponent,
        resolve: {
          task: GroupResolver
        },
        canDeactivate: [CanDeactivateGroupsDetail]
      },
    ]  
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupRoutingModule { }
