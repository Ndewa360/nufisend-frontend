import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { UserProfileModel } from "./user-profile.model";
import { Injectable } from "@angular/core";
import { UserProfileAction } from "./user-profile.actions";
import { UserProfileService } from "./user-profile.service";
import { ToastrService } from "ngx-toastr";
import { catchError, of, tap, throwError } from "rxjs";
import { GlobalAction } from "../global";

export class UserProfileStateModel {
    userProfile:UserProfileModel
    loadingUserProfile:boolean
}


@State<UserProfileStateModel>({
    name: "userprofile",
    defaults:{
        loadingUserProfile:false,
        userProfile:null
    }
})
@Injectable()
export class UserProfileState{
    constructor(
        private _userProfilesService:UserProfileService,
        private _toastrService:ToastrService
    ){}

    @Selector()
    static selectStateLoading(state:UserProfileStateModel)
    {
        return state.loadingUserProfile
    }

    @Selector()
    static selectStateData(state:UserProfileStateModel)
    {
        return state.userProfile
    }

    @Action(UserProfileAction.UpdateUserProfile)
    updateUserProfile(ctx:StateContext<UserProfileStateModel>, {userProfile,id}:UserProfileAction.UpdateUserProfile)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingUserProfile: true
        })

        return this._userProfilesService.updateUserProfile(userProfile,id).pipe(
            tap(
                (result)=>{
                    ctx.patchState({
                        loadingUserProfile:false,
                        userProfile
                    })
                    this._toastrService.success(`Profil utilisateur modifié avec success`, 'UserProfile');
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingUserProfile: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(UserProfileAction.UpdateUserWhatsappSyncProfile)
    updateUserWhastappSyncProfile(ctx:StateContext<UserProfileStateModel>,{status}:UserProfileAction.UpdateUserWhatsappSyncProfile)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                userProfile:{...state.userProfile,hasSyncWhatsApp:status}
            }
        )
        return ctx.dispatch(new GlobalAction.ChangeWhatsAppConnectedStatus(status));
    }
    @Action(UserProfileAction.updateLoadingUserProfileState)
    updateLoadingUserProfileState(ctx:StateContext<UserProfileStateModel>,{status}:UserProfileAction.updateLoadingUserProfileState)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                loadingUserProfile:status
            }
        )
        return of(true)
    }
    @Action(UserProfileAction.FetchUserProfile)
    fetchUserProfile(ctx:StateContext<UserProfileStateModel>,{email}:UserProfileAction.FetchUserProfile)
    {
        const state = ctx.getState();
        if(state.userProfile) return of(true);

        ctx.patchState({
            loadingUserProfile:true
        })
        return this._userProfilesService.getUserProfile(email).pipe(
            tap(
                result => {
                    ctx.setState({
                        loadingUserProfile:false,
                        userProfile:result.data
                    })
                    ctx.dispatch(new GlobalAction.ChangeWhatsAppConnectedStatus(!!result.data.hasSyncWhatsApp))
                }
            )
        )
    }
}