import { GroupModel } from "./group.model";
export namespace GroupAction
{
    //Create
    export class AddGroup
    {
        static readonly type = '[Group] Add Group';
        constructor(public group:GroupModel){}
    }

    //Create
    export class UpdateGroup
    {
        static readonly type = '[Group] Update Group';
        constructor(public group:GroupModel, public id:string){}
    }

    //Fetch All group
    export class FetchAllGroup
    {
        static readonly type = '[Group] Fectch All Group'
        /** force : recharger meme si les groupes sont deja en memoire. */
        constructor(public force:boolean = false){}
    }

    //Delete group
    export class DeleteGroup
    {
        static readonly type = '[Group] Delete Group'
        constructor(public id:string){}
    }

}
