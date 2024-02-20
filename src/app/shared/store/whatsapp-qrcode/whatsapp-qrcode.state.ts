import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { WhatsappQrCodeModel } from "./whatsapp-qrcode.model";
import { Injectable } from "@angular/core";
import { WhatsappQrCodeAction } from "./whatsapp-qrcode.actions";
import { ToastrService } from "ngx-toastr";
import { catchError, of, tap, throwError } from "rxjs";

export class WhatsappQrCodeStateModel {
    qrCode:string
    hasLoadingQrCode:boolean
}


@State<WhatsappQrCodeStateModel>({
    name: "whatsapp_qrcode",
    defaults:{
        qrCode:null,
        hasLoadingQrCode:true
    }
})
@Injectable()
export class WhatsappQrCodeState{
    constructor(
        private _toastrService:ToastrService
    ){}

    @Selector()
    static selectStateLoading(state:WhatsappQrCodeStateModel)
    {
        return state.hasLoadingQrCode
    }

    @Selector()
    static selectStateQrCode(state:WhatsappQrCodeStateModel)
    {
        return state.qrCode
    }


    @Action(WhatsappQrCodeAction.SetLoadingQrCode)
    setLoadingState(ctx:StateContext<WhatsappQrCodeStateModel>, {loading}:WhatsappQrCodeAction.SetLoadingQrCode)
    {
        ctx.patchState({
            hasLoadingQrCode:loading
        })
        return of(true)
    }

    @Action(WhatsappQrCodeAction.SetWhatsAppQrCode)
    setLoadingPercent(ctx:StateContext<WhatsappQrCodeStateModel>, {qrCode}:WhatsappQrCodeAction.SetWhatsAppQrCode)
    {
        ctx.patchState({
            qrCode
        })
        return of(true)
    }

    
}