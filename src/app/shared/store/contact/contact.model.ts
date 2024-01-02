export interface ContactModel {
    _id?:string;
    fullName?:string;
    emails?:{email?:string,label?:string}[];
    phoneNumbers?:{country?:string,phoneNumber?:string,label?:string}[];    
    skype?:string;
    websiteLink?:string;
    profilePicture?:string;
    address?:string;
    about?:string;
    jobTitle?:string;
    organization?:string;
    company?:string;
    birthday?:Date;
    avatar?:string;
    background?:string;

}

export interface WhatsappContact
{
    id:string;
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
}