import { MessageModel } from "../message";
import { CRON_JOB_RECCURENT_TYPE, CRON_JOB_TYPE } from "./planification.enum";

export type PlanificationType = {
    type:CRON_JOB_TYPE,
    time:string,
    startDate?:Date,
    endDate?:Date,
    every?:number,
    recurency?:CRON_JOB_RECCURENT_TYPE,
    dayOfWeek?:number,
    monthOfYear?:number,
    date?:Date,
    subJobId?:string,
    dates?:Date[],
    timezone?:string
  }
  
export interface PlanificationModel {
    _id?:string;
    
    owner?:string;

    message?:MessageModel;

    title?:string;
    
    planning?:PlanificationType[]

    isActive?:Boolean;

    /** Facturation : 'ok' ou 'suspended_insufficient_funds'. */
    billingStatus?:string;

    /** Toutes les dates de la planification sont passees (calcule par le serveur). */
    isExhausted?:boolean;
}

/** Une occurrence d'envoi : jour calendaire (YYYY-MM-DD, fuseau de la planification) et heure HH:mm. */
export interface PlanificationOccurrence
{
    date:string;
    time:string;
    planningIndex:number;
    type:string;
    /** Deja passee dans le fuseau de la planification. */
    past:boolean;
}

/** Occurrences d'une planification sur une plage de jours, telles que calculees par le serveur. */
export interface PlanificationOccurrencesItem
{
    _id:string;
    title:string;
    isActive:boolean;
    billingStatus:string;
    exhausted:boolean;
    /** Actif, solde suffisant et non epuise : les occurrences futures partiront. */
    willRun:boolean;
    occurrences:PlanificationOccurrence[];
}

