import { UserProfileModel } from "./user-profile.model";
export namespace UserProfileAction
{
    //Create
    export class UpdateUserProfile
    {
        static readonly type = '[UserProfile] Update UserProfile';
        constructor(public userProfile:UserProfileModel, public id:string){}
    }

    //Fetch  User profil
    export class FetchUserProfile
    {
        static readonly type = '[UserProfile] Fectch UserProfile'
        constructor(public email:string){}
    }

    //Update Sync Watsapp
    export class UpdateUserWhatsappSyncProfile
    {
        static readonly type = '[UserProfile] Sync Whatsapp UserProfile'
        constructor(public status:boolean){}
    }

    //Change loading state
    export class updateLoadingUserProfileState
    {
        static readonly type = '[UserProfile] Loading state UserProfile'
        constructor(public status:boolean){}
    }
}
