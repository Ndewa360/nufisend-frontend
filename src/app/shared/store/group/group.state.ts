import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { GroupModel } from "./group.model";
import { Injectable } from "@angular/core";
import { GroupAction } from "./group.actions";
import { GroupService } from "./group.service";
import { ToastrService } from "ngx-toastr";
import { catchError, of, tap, throwError } from "rxjs";

export class GroupStateModel {
    groups:GroupModel[]
    loadingGroups:boolean
}


@State<GroupStateModel>({
    name: "groups",
    defaults:{
        loadingGroups:false,
        groups:[]
    }
})
@Injectable()
export class GroupState{
    constructor(
        private _groupsService:GroupService,
        private _toastrService:ToastrService
    ){}

    @Selector()
    static selectStateLoading(state:GroupStateModel)
    {
        return state.loadingGroups
    }

    @Selector()
    static selectStateData(state:GroupStateModel)
    {
        return state.groups
    }

    static selectStateByGroupId(groupId:string)
    {
        return createSelector([GroupState],(state)=>{
            let data=state.groups.find((group)=>group._id==groupId)
            if(data) return data
            return null;
        })        
    }

    @Action(GroupAction.AddGroup)
    addGroup(ctx:StateContext<GroupStateModel>, {group}:GroupAction.AddGroup)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingGroups: true
        })

        return this._groupsService.createGroup(group).pipe(
            tap(
                (result)=>{
                    ctx.patchState({
                        loadingGroups:false,
                        groups:[...state.groups,result.data]
                    })
                    this._toastrService.success("Group ajouté avec success", 'Group');
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingGroups: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(GroupAction.UpdateGroup)
    updateGroup(ctx:StateContext<GroupStateModel>, {group,id}:GroupAction.UpdateGroup)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingGroups: true
        })

        return this._groupsService.updateGroup(group,id).pipe(
            tap(
                (result)=>{
                    
                    let groupIndex = state.groups.findIndex((c)=>c._id==id),groups = [...state.groups];
                    groups[groupIndex]=result.data
                    ctx.patchState({
                        loadingGroups:false,
                        groups
                    })
                    this._toastrService.success(`Group ${group.name} modifié avec success`, 'Group');
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingGroups: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(GroupAction.DeleteGroup)
    deleteGroup(ctx:StateContext<GroupStateModel>, {id}:GroupAction.DeleteGroup)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingGroups: true
        })

        return this._groupsService.deleteGroup(id).pipe(
            tap(
                (result)=>{                    
                    let groupIndex = state.groups.findIndex((c)=>c._id==id),groups = [...state.groups];
                    this._toastrService.success(`Group ${groups[groupIndex].name} supprimé avec success`, 'Group');
                    groups.splice(groupIndex,1);
                    ctx.patchState({
                        loadingGroups:false,
                        groups:[...groups]
                    })
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingGroups: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(GroupAction.SyncGroup)
    syncWhatsappGroup(ctx:StateContext<GroupStateModel>)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingGroups: true
        })

        return this._groupsService.syncGroups().pipe(
            tap(
                (result)=>{                    
                    this._toastrService.success(`Group synchronisé avec success`, 'Group');
                    ctx.patchState({
                        loadingGroups:false,
                    })
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingGroups: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(GroupAction.FetchAllGroup)
    fetchAllContats(ctx:StateContext<GroupStateModel>)
    {
        const state = ctx.getState();
        console.log("State ",state)
        if(state.groups.length>0) return of(true);

        ctx.patchState({
            loadingGroups: true
        })
        return this._groupsService.getGroups().pipe(
            tap(
                result => {
                    ctx.setState({
                        loadingGroups:false,
                        groups:result.data
                    })
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingGroups: false
                })
                return throwError(error);
                
            })
        )
    }
}