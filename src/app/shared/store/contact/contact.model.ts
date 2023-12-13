export interface ContactModel {
    fullName?:string;
    emails?:{email?:string,label?:string}[];
    phoneNumbers?:{country?:string,phoneNumber?:string,label?:string}[];    
    skype?:string;
    websiteLink?:string;
    profilePicture?:string;
    address?:string;
    about?:string;
    jobTitle?:string;
    organization?:string;
    company?:string;
    birthday?:Date;
    avatar?:string;

}