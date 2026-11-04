import { MessageTemplateModel } from "./message-template.model";
export namespace MessageTemplateAction
{
    //Create
    export class AddMessageTemplate
    {
        static readonly type = '[MessageTemplate] Add MessageTemplate';
        constructor(public messageTemplate:MessageTemplateModel){}
    }

    //Create
    export class UpdateMessageTemplate
    {
        static readonly type = '[MessageTemplate] Update MessageTemplate';
        constructor(public messageTemplate:MessageTemplateModel, public id:string){}
    }

    //Fetch All contact
    export class FetchAllMessageTemplate
    {
        static readonly type = '[MessageTemplate] Fectch All MessageTemplate'
        /** force : recharger meme si les modeles sont deja en memoire. */
        constructor(public force:boolean = false){}
    }

    //Delete contact
    export class DeleteMessageTemplate
    {
        static readonly type = '[MessageTemplate] Delete MessageTemplate'
        constructor(public id:string){}
    }
}
