import { Action, Selector, State, StateContext } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { catchError, tap, throwError } from "rxjs";
import { MessageAction } from "./message.actions";
import { MessageService } from "./message.service";
import { PlanificationAction } from "../planifcation";
import { NotificationsService } from "app/layout/common/notifications/notifications.service";

export class MessageStateModel {
    sendingMessage:boolean
}


@State<MessageStateModel>({
    name: "message",
    defaults:{
        sendingMessage:false,
    }
})
@Injectable()
export class MessageState{
    constructor(
        private _messageService:MessageService,
        private _toastrService:ToastrService,
        private _notificationsService:NotificationsService
    ){}

    @Selector()
    static selectStateLoading(state:MessageStateModel)
    {
        return state.sendingMessage
    }

   

    @Action(MessageAction.SendMessage)
    sendMessage(ctx:StateContext<MessageStateModel>, {message}:MessageAction.SendMessage)
    {
        const state = ctx.getState();
        ctx.patchState({
            sendingMessage: true
        })

        return this._messageService.sendMessage(message).pipe(
            tap(
                (result)=>{
                    ctx.patchState({
                        sendingMessage:false
                    })
                    const status = result?.data?.status;
                    if (message.isSentToNow && status === 'pending')
                        this._toastrService.info("L'envoi se poursuit en arrière-plan : vous serez notifié à la fin.", 'Envoi en cours');
                    else if (message.isSentToNow && status === 'partial')
                        this._toastrService.warning(`${result?.data?.lastSendResult?.sent ?? 0}/${result?.data?.lastSendResult?.total ?? 0} message(s) livré(s)`, 'Envoi partiel');
                    else
                        this._toastrService.success(message.isSentToNow ? "Message envoyé avec succès" : 'Message programmé avec succès', 'WhatsApp Message');
                    this._notificationsService.create({
                        icon: 'feather:send',
                        title: message.isSentToNow ? 'Message envoyé' : 'Message planifié',
                        description: message.title,
                        link: '/messagerie',
                        useRouter: true
                    }).subscribe();
                    if(!message.isSentToNow) ctx.dispatch(new PlanificationAction.AddPlanification(result.data))
                }
            ),
            catchError((error) => {
                const message = error?.error?.message;
                const text = Array.isArray(message) ? message.join(' ') : message;
                if (error?.status === 402) this._toastrService.warning(text, 'Solde insuffisant');
                else this._toastrService.error(text, 'Erreur');
                ctx.patchState({
                    sendingMessage: false
                })
                return throwError(error);
                
            })
        )
    }

}