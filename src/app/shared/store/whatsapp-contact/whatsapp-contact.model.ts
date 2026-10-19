export interface WhatsappContactModel
{
    id:string;
    server?:string;
    isBlocked:boolean;
    isBusiness:boolean;
    isEnterprise:boolean;
    isGroup:boolean;

    isMe:boolean;
    isMyContact:boolean;
    isUser:boolean;
    isWAContact:boolean;
    name:string;
    avatar:string

    number:string;
    pushname:string;
    shortName:string;
    countryCode?:string;
}
