import { MessageModel } from "./message.model";

export namespace MessageAction
{
    //Create
    export class SendMessage
    {
        static readonly type = '[Message] Send Direct message';
        constructor(public message:MessageModel){}
    }
}
