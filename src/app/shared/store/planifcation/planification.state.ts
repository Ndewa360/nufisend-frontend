import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { PlanificationModel } from "./planification.model";
import { Injectable } from "@angular/core";
import { PlanificationAction } from "./planification.actions";
import { PlanificationService } from "./planification.service";
import { ToastrService } from "ngx-toastr";
import { catchError, of, tap, throwError } from "rxjs";

export class PlanificationStateModel {
    planifications:PlanificationModel[]
    loadingPlanifications:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';

}


@State<PlanificationStateModel>({
    name: "planifications",
    defaults:{
        loadingPlanifications:false,
        planifications:[],
        initLoadingState:'NO_LOADED',
        
    }
})
@Injectable()
export class PlanificationState{
    constructor(
        private _planificationsService:PlanificationService,
        private _toastrService:ToastrService
    ){}

    @Selector()
    static selectStateLoading(state:PlanificationStateModel)
    {
        return state.loadingPlanifications
    }

    @Selector()
    static selectStateData(state:PlanificationStateModel)
    {
        return state.planifications
    }

    @Selector()
    static selectStateDataByState(state:boolean)
    {
        return createSelector([PlanificationState],(state)=>{
           return state.planifications.filter((planification)=>planification.isActive==state)
        })    
    }

    static selectStateByPlanificationId(planificationId:string)
    {
        return createSelector([PlanificationState],(state)=>{
            let data=state.planifications.find((planification)=>planification._id==planificationId)
            if(data) return data
            return null;
        })        
    }

    @Action(PlanificationAction.AddPlanification)
    addPlanification(ctx:StateContext<PlanificationStateModel>, {planification}:PlanificationAction.AddPlanification)
    {
        ctx.patchState({
            planifications:[...ctx.getState().planifications,planification]
        })

       return of(true)
    }

    @Action(PlanificationAction.UpdatePlanification)
    updatePlanification(ctx:StateContext<PlanificationStateModel>, {planification,id}:PlanificationAction.UpdatePlanification)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingPlanifications: true
        })

        return this._planificationsService.updatePlanification(planification,id).pipe(
            tap(
                (result)=>{
                    
                    let planificationIndex = state.planifications.findIndex((c)=>c._id==id),planifications = [...state.planifications];
                    planifications[planificationIndex]=result.data
                    ctx.patchState({
                        loadingPlanifications:false,
                        planifications
                    })
                    this._toastrService.success(`Planification modifié avec success`, 'Planification');
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingPlanifications: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(PlanificationAction.DeletePlanification)
    deletePlanification(ctx:StateContext<PlanificationStateModel>, {id}:PlanificationAction.DeletePlanification)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingPlanifications: true
        })

        return this._planificationsService.deletePlanification(id).pipe(
            tap(
                (result)=>{                    
                    let planificationIndex = state.planifications.findIndex((c)=>c._id==id),planifications = [...state.planifications];
                    this._toastrService.success(`Planification  supprimé avec success`, 'Planification');
                    planifications.splice(planificationIndex,1);
                    ctx.patchState({
                        loadingPlanifications:false,
                        planifications:[...planifications]
                    })
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingPlanifications: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(PlanificationAction.SyncPlanification)
    syncWhatsappPlanification(ctx:StateContext<PlanificationStateModel>)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingPlanifications: true
        })

        return this._planificationsService.syncPlanifications().pipe(
            tap(
                (result)=>{                    
                    this._toastrService.success(`Planification synchronisé avec success`, 'Planification');
                    ctx.patchState({
                        loadingPlanifications:false,
                    });
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingPlanifications: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(PlanificationAction.FetchAllPlanification)
    fetchAllPlanifications(ctx:StateContext<PlanificationStateModel>)
    {
        const state = ctx.getState();
        if(state.planifications.length>0) return of(true);

        ctx.patchState({
            loadingPlanifications: true,
            initLoadingState:"LOADING"
        })
        return this._planificationsService.getPlanifications().pipe(
            tap(
                result => {
                    ctx.setState({
                        loadingPlanifications:false,
                        planifications:result.data,
                        initLoadingState:"LOADED"
                    })
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingPlanifications: false,
                    initLoadingState:"LOADED"
                })
                return throwError(error);
                
            })
        )
    }
}