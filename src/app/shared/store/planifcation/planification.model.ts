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
    subJobId:string,
    dates?:Date[]
  }
  
export interface PlanificationModel {
    _id?:string;
    
    owner?:string;

    message?:MessageModel;

    title?:string;
    
    planning?:PlanificationType[]

    isActive?:Boolean;
}

