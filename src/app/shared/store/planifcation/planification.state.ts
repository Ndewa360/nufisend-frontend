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
    /** Vrai si le dernier chargement a echoue (ne pas confondre avec une liste vide). */
    loadError:boolean;
}


@State<PlanificationStateModel>({
    name: "planifications",
    defaults:{
        loadingPlanifications:false,
        planifications:[],
        initLoadingState:'NO_LOADED',
        loadError:false,
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
    static selectStateLoadError(state:PlanificationStateModel)
    {
        return state.loadError
    }

    @Selector()

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
        ctx.patchState({
            loadingPlanifications: true
        })

        return this._planificationsService.updatePlanification(planification,id).pipe(
            tap(
                (result)=>{
                    // Remplacement par identifiant (jamais par index : une ligne absente ne doit pas
                    // ecraser une autre planification).
                    const planifications = ctx.getState().planifications.map((item)=> item._id==id ? result.data : item);
                    ctx.patchState({
                        loadingPlanifications:false,
                        planifications
                    })
                    this._toastrService.success('Planification modifiée avec succès', 'Planification');
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
        ctx.patchState({
            loadingPlanifications: true
        })

        return this._planificationsService.deletePlanification(id).pipe(
            tap(
                ()=>{
                    this._toastrService.success('Planification supprimée avec succès', 'Planification');
                    ctx.patchState({
                        loadingPlanifications:false,
                        planifications: ctx.getState().planifications.filter((item)=> item._id!=id)
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

    @Action(PlanificationAction.FetchAllPlanification)
    fetchAllPlanifications(ctx:StateContext<PlanificationStateModel>, {force}:PlanificationAction.FetchAllPlanification)
    {
        const state = ctx.getState();
        if(state.planifications.length>0 && !force) {
            if(state.initLoadingState !== "LOADED") ctx.patchState({initLoadingState:"LOADED"});
            return of(true);
        }

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
                        initLoadingState:"LOADED",
                        loadError:false
                    })
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingPlanifications: false,
                    initLoadingState:"LOADED",
                    loadError:true
                })
                return throwError(error);
                
            })
        )
    }
}