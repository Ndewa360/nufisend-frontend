import { ContactModel } from "./contact.model";
export namespace ContactAction
{
    //Create
    export class AddContact
    {
        static readonly type = '[Contact] Add Contact';
        constructor(public contact:ContactModel){}
    }

    //Fetch All contact
    export class FetchAllContact
    {
        static readonly type = '[Contact] Fectch All Contact'
    }
}
