import { ContactModel } from "../contact";
import { GroupModel } from "../group";

export enum MessageType{
    TEXT="text",
    IMAGE = "image",
    DOCUMENT = "document",
    CONTACT = "contact" 
}

export enum MessageStatus{
    PENDING = "pending",
    SCHEDULED = "scheduled",
    SENT = "sent",
    PARTIAL = "partial",
    FAILED = "failed"
}

export interface MessagePlanification
{
    type: string;
    time?: string;
    timezone?: string;
    startDate?: string;
    endDate?: string;
    every?: number;
    recurency?: string;
    dayOfWeek?: number;
    monthOfYear?: number;
    date?: string;
    dates?: string[];
    [key: string]: unknown;
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

    /** Modele WhatsApp approuve (membres d'organisation, API Cloud). */
    template?: { name: string; language?: string; variables?: string[]; headerMediaUrl?: string };

    planification?:MessagePlanification[];

    status?:MessageStatus;
    sentAt?:string|Date;
    lastSendResult?:Record<string, unknown>;
    
    bodyText?:string;
    bodyFile?:File;
}