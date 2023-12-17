import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
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

    static selectStateByContactId(contactId:string)
    {
        return createSelector([ContactState],(state)=>{
            let data=state.contacts.find((contact)=>contact._id==contactId)
            if(data) return data
            return null;
        })        
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
                    this._toastrService.success("Contact ajouté avec success", 'Contact');
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingContacts: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(ContactAction.UpdateContact)
    updateContact(ctx:StateContext<ContactStateModel>, {contact,id}:ContactAction.UpdateContact)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingContacts: true
        })

        return this._contactsService.updateContact(contact,id).pipe(
            tap(
                (result)=>{
                    
                    let contactIndex = state.contacts.findIndex((c)=>c._id==id),contacts = state.contacts;
                    contact[contactIndex]=result.data
                    ctx.patchState({
                        loadingContacts:false,
                        contacts
                    })
                    this._toastrService.success(`Contact ${contact.fullName} modifié avec success`, 'Contact');
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingContacts: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(ContactAction.DeleteContact)
    deleteContact(ctx:StateContext<ContactStateModel>, {id}:ContactAction.DeleteContact)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingContacts: true
        })

        return this._contactsService.deleteContact(id).pipe(
            tap(
                (result)=>{                    
                    let contactIndex = state.contacts.findIndex((c)=>c._id==id),contacts = [...state.contacts];
                    this._toastrService.success(`Contact ${contacts[contactIndex].fullName} supprimé avec success`, 'Contact');
                    contacts.splice(contactIndex,1);
                    ctx.patchState({
                        loadingContacts:false,
                        contacts:[...contacts]
                    })
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
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