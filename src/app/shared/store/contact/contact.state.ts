import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { ContactModel } from "./contact.model";
import { Injectable } from "@angular/core";
import { ContactAction } from "./contact.actions";
import { ContactService } from "./contact.service";
import { ToastrService } from "ngx-toastr";
import { catchError, of, tap, throwError } from "rxjs";

export class ContactStateModel {
    contacts:ContactModel[]
    loadingContacts:boolean;
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';

}


@State<ContactStateModel>({
    name: "contacts",
    defaults:{
        loadingContacts:false,
        initLoadingState:'NO_LOADED',
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

    static selectStateByContactsId(contactsId:string[])
    {
        return createSelector([ContactState],(state)=>{
            console.log("Contact ", contactsId.map((contactId)=> state.contacts.find((contact)=>contact._id==contactId)))
            return contactsId.map((contactId)=> state.contacts.find((contact)=>contact._id==contactId)).filter((contact)=> contact!=undefined && contact!=null)
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
                    
                    const contacts = [...state.contacts];
                    const contactIndex = contacts.findIndex((c)=>c._id==id);
                    if(contactIndex > -1) contacts[contactIndex]=result.data;
                    ctx.patchState({
                        loadingContacts:false,
                        contacts
                    })
                    this._toastrService.success(`Contact ${result.data?.fullName ?? contact.fullName} modifié avec success`, 'Contact');
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

    @Action(ContactAction.SyncContact)
    syncWhatsappContact(ctx:StateContext<ContactStateModel>)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingContacts: true
        })

        return this._contactsService.syncContacts().pipe(
            tap(
                (result)=>{                    
                    this._toastrService.success(`Contact synchronisé avec success`, 'Contact');
                    ctx.patchState({
                        loadingContacts:false,
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

    @Action(ContactAction.ImportContact)
    importContacts(ctx:StateContext<ContactStateModel>, {file}:ContactAction.ImportContact)
    {
        ctx.patchState({
            loadingContacts: true
        })

        return this._contactsService.importContacts(file).pipe(
            tap(
                ()=>{
                    this._toastrService.success("Contacts importés avec success", 'Contact');
                    ctx.patchState({
                        loadingContacts:false,
                        initLoadingState:"NO_LOADED"
                    })
                    ctx.dispatch(new ContactAction.FetchAllContact());
                }
            ),
            catchError((error) => {
                this._toastrService.error(error?.error?.message || "Echec de l'import", 'Erreur');
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
        const state = ctx.getState();
        if(state.contacts.length>0) {
            if(state.initLoadingState !== "LOADED") ctx.patchState({initLoadingState:"LOADED"});
            return of(true);
        }

        ctx.patchState({
            loadingContacts: true,
            initLoadingState:"LOADING"
        })
        return this._contactsService.getContacts().pipe(
            tap(
                result => {
                    ctx.setState({
                        loadingContacts:false,
                        contacts:result.data,
                        initLoadingState:"LOADED"
                    })
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingContacts: false,
                    initLoadingState:"LOADED"
                })
                return throwError(error);
                
            })
        )
    }
}