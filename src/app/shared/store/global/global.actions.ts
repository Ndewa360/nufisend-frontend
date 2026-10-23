import { GlobalModel } from "./global.model";
export namespace GlobalAction
{
    //Create
    export class AddNotification
    {
        static readonly type = '[Global-Notification] Add Notification';
        constructor(public notification:any){}
    }

    //Fetch All Global
    export class ChangeLoading
    {
        static readonly type = '[Global-Loading] Change Loading';
        constructor(public isLoading:boolean){}
    }

    export class ChangeWhatsAppConnectedStatus
    {
        static readonly type = '[Global-WhatsApp-Status] Change WhatsApp Status';
        constructor(public status:boolean){}
    }

    export class SetWhatsAppSyncStatus
    {
        static readonly type = '[Global-WhatsApp-Sync] Set WhatsApp Sync Status';
        constructor(public status: GlobalModel['whatsappSyncStatus'], public progress: number = 0, public message: string | null = null){}
    }

    export class ResetWhatsAppSync
    {
        static readonly type = '[Global-WhatsApp-Sync] Reset WhatsApp Sync';
        constructor(){}
    }
}
