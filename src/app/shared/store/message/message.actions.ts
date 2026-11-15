import { newIdempotencyKey } from "app/shared/utils/idempotency-key";
import { MessageModel } from "./message.model";

export namespace MessageAction
{
    //Create
    export class SendMessage
    {
        static readonly type = '[Message] Send Direct message';
        /** Une cle par soumission : un rejeu (reseau, double clic) ne cree pas un second envoi. */
        constructor(public message:MessageModel, public idempotencyKey:string = newIdempotencyKey()){}
    }
}
