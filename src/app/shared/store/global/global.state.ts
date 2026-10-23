import { Action, Selector, State, StateContext } from "@ngxs/store";
import { GlobalModel } from "./global.model";
import { Injectable } from "@angular/core";
import { GlobalAction } from "./global.actions";
import { of } from "rxjs";

@State<GlobalModel>({
    name: "globals",
    defaults:{
        isLoading:false,
        isConnectedToWhatsapp:false,
        whatsappSyncStatus: 'unknown',
        whatsappSyncProgress: 0,
        whatsappSyncMessage: null,
        notifications:[]
    }
})
@Injectable()
export class GlobalState{

    @Action(GlobalAction.ChangeLoading)
    setGlobalLoading(ctx:StateContext<GlobalModel>,action:GlobalAction.ChangeLoading)
    {
        ctx.patchState({isLoading:action.isLoading});
        return of(true)
    }

    @Selector()
    static selectStateConnectedWhatsApp(state:GlobalModel)
    {
        return state.isConnectedToWhatsapp
    }

    @Selector()
    static selectWhatsAppSyncStatus(state:GlobalModel)
    {
        return {
            status: state.whatsappSyncStatus,
            progress: state.whatsappSyncProgress,
            message: state.whatsappSyncMessage
        }
    }

    @Selector()
    static isWhatsAppReady(state:GlobalModel)
    {
        return state.whatsappSyncStatus === 'ready' && state.isConnectedToWhatsapp
    }

    @Selector()
    static isWhatsAppSyncing(state:GlobalModel)
    {
        return state.whatsappSyncStatus === 'syncing' || state.whatsappSyncStatus === 'connecting'
    }


    @Action(GlobalAction.AddNotification)
    addNewGlobalNotification(ctx:StateContext<GlobalModel>,action:GlobalAction.AddNotification)
    {
        const state = ctx.getState()
        const notifs = [...state.notifications,action.notification];
        const pos = notifs.length-1;
        ctx.patchState({notifications:notifs});
        setTimeout(()=>{
            notifs.splice(pos,1);
            ctx.patchState({notifications:notifs})
        },10000);
    }

    @Action(GlobalAction.ChangeWhatsAppConnectedStatus)
    updateWhatsConnectedAppStatus(ctx:StateContext<GlobalModel>,{status}:GlobalAction.ChangeWhatsAppConnectedStatus)
    {
        ctx.patchState({isConnectedToWhatsapp:status});
        if (!status && ctx.getState().whatsappSyncStatus === 'ready') {
            ctx.patchState({whatsappSyncStatus: 'connecting', whatsappSyncProgress: 0, whatsappSyncMessage: 'Reconnexion en cours...'});
        }
        return of(true);
    }

    @Action(GlobalAction.SetWhatsAppSyncStatus)
    setWhatsAppSyncStatus(ctx:StateContext<GlobalModel>,{status, progress, message}:GlobalAction.SetWhatsAppSyncStatus)
    {
        ctx.patchState({
            whatsappSyncStatus: status,
            whatsappSyncProgress: Math.max(0, Math.min(100, progress || 0)),
            whatsappSyncMessage: message || null
        });
        return of(true);
    }

    @Action(GlobalAction.ResetWhatsAppSync)
    resetWhatsAppSync(ctx:StateContext<GlobalModel>)
    {
        ctx.patchState({
            whatsappSyncStatus: 'unknown',
            whatsappSyncProgress: 0,
            whatsappSyncMessage: null,
            isConnectedToWhatsapp: false
        });
        return of(true);
    }
}