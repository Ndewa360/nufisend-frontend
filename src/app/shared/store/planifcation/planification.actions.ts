import { PlanificationModel } from "./planification.model";
export namespace PlanificationAction
{
    //Create
    export class AddPlanification
    {
        static readonly type = '[Planification] Add Planification';
        constructor(public planification:PlanificationModel){}
    }

    //Create
    export class UpdatePlanification
    {
        static readonly type = '[Planification] Update Planification';
        constructor(public planification:PlanificationModel, public id:string){}
    }

    //Fetch All planification
    export class FetchAllPlanification
    {
        static readonly type = '[Planification] Fectch All Planification'
        /** force : recharger meme si les planifications sont deja en memoire. */
        constructor(public force:boolean = false){}
    }

    //Delete planification
    export class DeletePlanification
    {
        static readonly type = '[Planification] Delete Planification'
        constructor(public id:string){}
    }
}
