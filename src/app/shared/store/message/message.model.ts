import { ContactModel } from "../contact";
import { GroupModel } from "../group";

export enum MessageType{
    TEXT="text",
    IMAGE = "image",
    DOCUMENT = "document",
    CONTACT = "contact" 
}

export interface MessageModel
{
    type:MessageType;

    title:string;

    
    contactsID?:string[];

    
    groupsID?:string[];

    contacts?:ContactModel[];

    groups?:GroupModel[];

    
    isSentToNow:boolean;

    
    dateToSend?:Date;
    
    
    messageTemplateId?:string;

    planification?:Record<string,any>;
    
    bodyText?:string;
    bodyFile?:File;
}