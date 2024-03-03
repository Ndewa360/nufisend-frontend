export enum MessageType{
    TEXT="text",
    IMAGE = "image",
    DOCUMENT = "document",
    CONTACT = "contact" 
}

export interface MessageModel
{
    type:MessageType;

    
    contactsID?:string[];

    
    groupsID?:string[];

    
    isSentToNow:boolean;

    
    dateToSend?:Date;
    
    
    messageTemplateId?:string;

    planification?:Record<string,any>;
    
    bodyText?:string;
    bodyFile?:File;
}