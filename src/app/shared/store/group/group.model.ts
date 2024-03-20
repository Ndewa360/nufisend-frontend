import { ContactModel } from "../contact";

export interface GroupModel
{
    _id:string;

    icon:string;

    name:string;

    description?:string;
    
    contacts?:string[];

    
    profilePicture:string;

}