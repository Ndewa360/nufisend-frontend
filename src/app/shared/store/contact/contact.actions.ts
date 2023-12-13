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
}
