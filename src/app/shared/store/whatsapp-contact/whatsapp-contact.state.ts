import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { WhatsappContactModel } from "./whatsapp-contact.model";
import { Injectable } from "@angular/core";
import { WhatsappContactAction } from "./whatsapp-contact.actions";
import { ToastrService } from "ngx-toastr";
import { catchError, of, tap, throwError } from "rxjs";

export class WhatsappContactStateModel {
    contacts:WhatsappContactModel[]
    startLoading:boolean
    percentLoading:number
    syncError:string
}


@State<WhatsappContactStateModel>({
    name: "whatsapp_contacts",
    defaults:{
        startLoading:false,
        percentLoading:0,
        contacts:[],
        syncError:null
    }
})
@Injectable()
export class WhatsappContactState{
    constructor(
        private _toastrService:ToastrService
    ){}

    @Selector()
    static selectStateLoading(state:WhatsappContactStateModel)
    {
        return state.startLoading
    }

    @Selector()
    static selectStatePercent(state:WhatsappContactStateModel)
    {
        return state.percentLoading
    }

    @Selector()
    static selectStateData(state:WhatsappContactStateModel)
    {
        return state.contacts
    }

    @Selector()
    static selectStateSyncError(state:WhatsappContactStateModel)
    {
        return state.syncError
    }

    static selectStateByWhatsappContactId(contactId:string)
    {
        return createSelector([WhatsappContactState],(state)=>{
            let data=state.contacts.find((contact)=>contact.id==contactId)
            if(data) return data
            return null;
        })        
    }

    @Action(WhatsappContactAction.SetLoadingState)
    setLoadingState(ctx:StateContext<WhatsappContactStateModel>, {status}:WhatsappContactAction.SetLoadingState)
    {
        ctx.patchState({
            startLoading:status
        })
        return of(true)
    }

    @Action(WhatsappContactAction.SetLoadingPercent)
    setLoadingPercent(ctx:StateContext<WhatsappContactStateModel>, {percent}:WhatsappContactAction.SetLoadingPercent)
    {
        ctx.patchState({
            percentLoading:percent
        })
        return of(true)
    }

    @Action(WhatsappContactAction.SetSyncError)
    setSyncError(ctx:StateContext<WhatsappContactStateModel>, {message}:WhatsappContactAction.SetSyncError)
    {
        ctx.patchState({
            syncError:message,
            startLoading:false
        })
        return of(true)
    }

    @Action(WhatsappContactAction.SetAllWhatsappContactToLocal)
    setAllContatsToLocal(ctx:StateContext<WhatsappContactStateModel>,{contactsList}:WhatsappContactAction.SetAllWhatsappContactToLocal)
    {
        const state = ctx.getState();
        ctx.patchState({
            contacts:contactsList
        })
        return of(true)
    }
}