export interface User {
    _id?: string;
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    country?: string;
    location?: string;
    phoneNumber?: string;
    hasSyncWhatsApp?: boolean;
    emailConfirmed?: boolean;
    role?: string;
    permissions?: string;
    isBlocked?: boolean;
    createdAt?: Date;
}
