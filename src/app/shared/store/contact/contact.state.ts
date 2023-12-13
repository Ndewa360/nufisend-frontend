import { Action, Selector, State, StateContext } from "@ngxs/store";
import { ContactModel } from "./contact.model";
import { Injectable } from "@angular/core";
import { ContactAction } from "./contact.actions";
import { ContactService } from "./contact.service";
import { ToastrService } from "ngx-toastr";
import { catchError, of, tap, throwError } from "rxjs";

export class ContactStateModel {
    contacts:ContactModel[]
    loadingContacts:boolean
}


@State<ContactStateModel>({
    name: "contacts",
    defaults:{
        loadingContacts:false,
        contacts:[]
    }
})
@Injectable()
export class ContactState{
    constructor(
        private _contactsService:ContactService,
        private _toastrService:ToastrService
    ){}

    @Selector()
    static selectStateLoading(state:ContactStateModel)
    {
        return state.loadingContacts
    }

    @Selector()
    static selectStateData(state:ContactStateModel)
    {
        return state.contacts
    }

    @Action(ContactAction.AddContact)
    addContact(ctx:StateContext<ContactStateModel>, {contact}:ContactAction.AddContact)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingContacts: true
        })

        return this._contactsService.createContact(contact).pipe(
            tap(
                (result)=>{
                    ctx.patchState({
                        loadingContacts:false,
                        contacts:[...state.contacts,result.data]
                    })
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.setState({
                    ...state,
                    // error: error?.error?.message,
                    loadingContacts: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(ContactAction.FetchAllContact)
    fetchAllContats(ctx:StateContext<ContactStateModel>)
    {
        return this._contactsService.getContacts().pipe(
            tap(
                result => {
                    const state = ctx.getState();
                    console.log("Result data", result)
                    ctx.setState({
                        loadingContacts:false,
                        contacts:result.data
                    })
                }
            )
        )
    }
}