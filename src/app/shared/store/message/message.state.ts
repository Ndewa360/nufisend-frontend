import { Action, Selector, State, StateContext } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { catchError, tap, throwError } from "rxjs";
import { MessageAction } from "./message.actions";
import { MessageService } from "./message.service";

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
        private _toastrService:ToastrService
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
                    this._toastrService.success("Message envoyé avec success", 'WhatsApp Message');
                    // if(!message.isSentToNow) this.
                }
            ),
            catchError((error) => {
                console.error("Error ",error)
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    sendingMessage: false
                })
                return throwError(error);
                
            })
        )
    }

}