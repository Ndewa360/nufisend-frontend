import { WhatsappContactModel } from "./whatsapp-contact.model"

export namespace WhatsappContactAction
{
    

    //Set All contact
    export class SetAllWhatsappContactToLocal
    {
        static readonly type = '[WhatsappContact] Fectch All WhatsappContact'
        constructor(public contactsList:WhatsappContactModel[]){}
    }

    //Set loading
    export class SetLoadingState
    {
        static readonly type = '[WhatsappContact] Set Loading state'
        constructor(public status:boolean){}
    }

    //Set loading percent
    export class SetLoadingPercent
    {
        static readonly type = '[WhatsappContact] Set Loading percent'
        constructor(public percent:number){}
    }

    //Set sync error message
    export class SetSyncError
    {
        static readonly type = '[WhatsappContact] Set Sync Error'
        constructor(public message:string){}
    }


    //Sync contact
    export class SyncWhatsappContact
    {
        static readonly type = '[WhatsappContact] Sync WhatsappContact'
        constructor(){}
    }
}
