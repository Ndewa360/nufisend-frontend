import { ContactModel, MessageModel } from "../store";

export class ContactExtractData
{
    static getWhatsappPhone(contact:ContactModel)
    {
        return (contact?.phoneNumbers || []).find((phone)=>phone.label=="whatsapp");
    }

    static getDefaultMail(contact:ContactModel)
    {
        return (contact?.emails || []).find((email)=> email.label=="default")
    }
}

/** Variables connues : meme liste que le serveur (backend/src/message/utils/template-variables.ts). */
export const KNOWN_TEMPLATE_VARIABLES: readonly string[] = [
    'receiverFullName', 'receiverFirstName', 'receiverEmail', 'receiverCompany',
    'receiverJobTitle', 'receiverOrganization', 'receiverAddress',
    'senderFullName', 'senderEmail', 'dateToSend', 'plateform',
];

/** {{nom}} ou {{nom|valeur de repli}} (espaces toleres). */
const VARIABLE_REF = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*(?:\|([^{}]*))?\}\}/g;

const escapeHtml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export class MessageProcessing
{
    /**
     * Remplace les variables connues. Valeur vide : valeur de repli, sinon vide.
     * Les variables inconnues sont laissees telles quelles.
     */
    static renderVariables(text: string, values: Record<string, unknown>, escape = false): string
    {
        return String(text ?? '').replace(VARIABLE_REF, (match: string, name: string, fallback?: string) => {
            if (!KNOWN_TEMPLATE_VARIABLES.includes(name)) return match;
            const value = values?.[name];
            const out = value !== undefined && value !== null && String(value).trim() !== ''
                ? String(value)
                : (fallback !== undefined ? fallback.trim() : '');
            return escape ? escapeHtml(out) : out;
        });
    }

    /** Prenom : champ dedie, sinon le premier mot du nom complet. */
    static firstNameOf(contact: ContactModel): string
    {
        const explicit = String(contact?.firstName || '').trim();
        if (explicit) return explicit;
        return String(contact?.fullName || '').trim().split(/\s+/)[0] || '';
    }

    static getVarListWithValues(contact: ContactModel, sender, dateToSend): Record<string, any>
    {
        return {
            senderEmail: sender?.email || "",
            senderFullName: `${sender?.firstName || ""} ${sender?.lastName || ""}`.trim(),
            receiverFullName: `${contact?.fullName || ""}`,
            receiverFirstName: MessageProcessing.firstNameOf(contact),
            receiverEmail: ContactExtractData.getDefaultMail(contact)?.email || "",
            receiverCompany: `${(contact as any)?.company || ""}`,
            receiverJobTitle: `${(contact as any)?.jobTitle || ""}`,
            receiverOrganization: `${(contact as any)?.organization || ""}`,
            receiverAddress: `${(contact as any)?.address || ""}`,
            dateToSend: (dateToSend ? new Date(dateToSend) : new Date()).toLocaleDateString("fr-FR", { timeZone: "Africa/Douala" }),
            plateform: "NufiSend"
        };
    }

    /** Texte d'un message pour un destinataire (apercu). `escape` pour un affichage HTML. */
    static getPersonalizedMessage(bodyText, contact: ContactModel, sender, dateToSend, escape = false)
    {
        return MessageProcessing.renderVariables(
            bodyText || "",
            MessageProcessing.getVarListWithValues(contact, sender, dateToSend),
            escape,
        );
    }
}
