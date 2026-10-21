import { ContactModel } from "./contact.model";
export namespace ContactAction
{
    //Create
    export class AddContact
    {
        static readonly type = '[Contact] Add Contact';
        constructor(public contact:ContactModel){}
    }

    //Create
    export class UpdateContact
    {
        static readonly type = '[Contact] Update Contact';
        constructor(public contact:ContactModel, public id:string){}
    }

    //Fetch All contact
    export class FetchAllContact
    {
        static readonly type = '[Contact] Fectch All Contact'
    }

    //Delete contact
    export class DeleteContact
    {
        static readonly type = '[Contact] Delete Contact'
        constructor(public id:string){}
    }

    //Sync contact
    export class SyncContact
    {
        static readonly type = '[Contact] Sync Contact'
        constructor(){}
    }

    //Import contacts from CSV
    export class ImportContact
    {
        static readonly type = '[Contact] Import Contact'
        constructor(public file:File){}
    }
}
