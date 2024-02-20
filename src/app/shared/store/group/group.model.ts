import { ContactModel } from "../contact";

export interface GroupModel
{
    _id:string;

    name:string;

    description?:string;
    
    contacts?:ContactModel[];

    
    profilePicture:string;

}