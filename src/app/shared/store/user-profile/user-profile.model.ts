import { KeycloakProfile } from "keycloak-js";

export interface UserProfileModel {
    _id?:string;
    keycloakProfile:KeycloakProfile
    email?:string;
    profilePicture?:string;

    country?:string;

    location?:string;

    phoneNumber?:string;

    hasSyncWhatsApp?:boolean;
}