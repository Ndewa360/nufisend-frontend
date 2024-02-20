import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { MessageTemplateModel } from "./message-template.model";
import { Injectable } from "@angular/core";
import { MessageTemplateAction } from "./message-template.actions";
import { MessageTemplateService } from "./message-template.service";
import { ToastrService } from "ngx-toastr";
import { catchError, of, tap, throwError } from "rxjs";

export class MessageTemplateStateModel {
    messageTemplates:MessageTemplateModel[]
    loadingMessageTemplates:boolean
}


@State<MessageTemplateStateModel>({
    name: "messageTemplates",
    defaults:{
        loadingMessageTemplates:false,
        messageTemplates:[]
    }
})
@Injectable()
export class MessageTemplateState{
    constructor(
        private _messageTemplatesService:MessageTemplateService,
        private _toastrService:ToastrService
    ){}

    @Selector()
    static selectStateLoading(state:MessageTemplateStateModel)
    {
        return state.loadingMessageTemplates
    }

    @Selector()
    static selectStateData(state:MessageTemplateStateModel)
    {
        return state.messageTemplates
    }

    static selectStateByMessageTemplateId(messageTemplateId:string)
    {
        return createSelector([MessageTemplateState],(state)=>{
            let data=state.messageTemplates.find((messageTemplate)=>messageTemplate._id==messageTemplateId)
            if(data) return data
            return null;
        })        
    }

    @Action(MessageTemplateAction.AddMessageTemplate)
    addMessageTemplate(ctx:StateContext<MessageTemplateStateModel>, {messageTemplate}:MessageTemplateAction.AddMessageTemplate)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingMessageTemplates: true
        })

        return this._messageTemplatesService.createMessageTemplate(messageTemplate).pipe(
            tap(
                (result)=>{
                    ctx.patchState({
                        loadingMessageTemplates:false,
                        messageTemplates:[...state.messageTemplates,result.data]
                    })
                    this._toastrService.success("Message Template ajouté avec success", 'MessageTemplate');
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingMessageTemplates: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(MessageTemplateAction.UpdateMessageTemplate)
    updateMessageTemplate(ctx:StateContext<MessageTemplateStateModel>, {messageTemplate,id}:MessageTemplateAction.UpdateMessageTemplate)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingMessageTemplates: true
        })

        return this._messageTemplatesService.updateMessageTemplate(messageTemplate,id).pipe(
            tap(
                (result)=>{
                    let messageTemplateIndex = state.messageTemplates.findIndex((c)=>c._id==id),messageTemplates = [...state.messageTemplates];
                    messageTemplates[messageTemplateIndex]=result.data
                    ctx.patchState({
                        loadingMessageTemplates:false,
                        messageTemplates
                    })
                    this._toastrService.success(`Message Template ${messageTemplate.title} modifié avec success`, 'MessageTemplate');
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingMessageTemplates: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(MessageTemplateAction.DeleteMessageTemplate)
    deleteMessageTemplate(ctx:StateContext<MessageTemplateStateModel>, {id}:MessageTemplateAction.DeleteMessageTemplate)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingMessageTemplates: true
        })

        return this._messageTemplatesService.deleteMessageTemplate(id).pipe(
            tap(
                (result)=>{                    
                    let messageTemplateIndex = state.messageTemplates.findIndex((c)=>c._id==id),messageTemplates = [...state.messageTemplates];
                    this._toastrService.success(`Message Template ${messageTemplates[messageTemplateIndex].title} supprimé avec success`, 'MessageTemplate');
                    messageTemplates.splice(messageTemplateIndex,1);
                    ctx.patchState({
                        loadingMessageTemplates:false,
                        messageTemplates:[...messageTemplates]
                    })
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingMessageTemplates: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(MessageTemplateAction.FetchAllMessageTemplate)
    fetchAllTemplates(ctx:StateContext<MessageTemplateStateModel>)
    {
        const state = ctx.getState();
        if(state.messageTemplates.length>0) return of(true);;

        ctx.patchState({
            loadingMessageTemplates: true
        })

        return this._messageTemplatesService.getMessageTemplates().pipe(
            tap(
                result => {
                    ctx.setState({
                        loadingMessageTemplates:false,
                        messageTemplates:result.data
                    })
                }
            )
        )
    }
}