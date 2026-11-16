import { MessageModel, MessageType } from 'app/shared/store/message';
import { htmlToWhatsappText, WHATSAPP_TEXT_MAX_LENGTH } from 'app/shared/utils/whatsapp-text';

/** Canal d'envoi : API WhatsApp Business (membre d'organisation) ou session WhatsApp Web (personnel). */
export type SendChannel = 'cloud' | 'personal';

export interface SendTarget {
    contactIds: string[];
    groupIds: string[];
}

export interface SendComposition {
    /** Corps rédigé (HTML de l'éditeur), null si vide. */
    message: string | null;
    files: File[];
    /** Modèle de message personnel (identifiant), facultatif. */
    messageTemplateId?: string | null;
}

export interface SendInput {
    channel: SendChannel;
    isSentToNow: boolean;
    target: SendTarget;
    composition: SendComposition;
    /** Modèle WhatsApp approuvé (canal Cloud uniquement). */
    cloudTemplate?: { name: string; language?: string; variables?: string[]; headerMediaUrl?: string; urlVariableValue?: string } | null;
    /** Toutes les variables du modèle sont renseignées. */
    cloudTemplateComplete?: boolean;
    /** Planification (uniquement pour un envoi programme). */
    planification?: MessageModel['planification'] | null;
    /** Solde suffisant pour le cout estime. */
    costSufficient: boolean;
    /** Erreur de canal signalée par le formulaire de rédaction. */
    composeError?: string | null;
}

export interface SendError {
    level: 'error' | 'warning';
    title: string;
    message: string;
}

export type SendBuildResult =
    | { ok: true; payload: MessageModel }
    | { ok: false; error: SendError };

const fail = (level: SendError['level'], title: string, message: string): { ok: false; error: SendError } => ({ ok: false, error: { level, title, message } });

/**
 * Unique construction et validation d'un envoi, pour toutes les entrées de la messagerie
 * (envoi groupe, envoi a un contact). Les regles suivent le backend (POST /message/post).
 */
export function buildSendPayload(input: SendInput): SendBuildResult
{
    const { channel, isSentToNow, target, composition } = input;
    const isCloud = channel === 'cloud';
    const text = htmlToWhatsappText(composition.message);
    const files = composition.files || [];
    const hasTemplate = isCloud && !!input.cloudTemplate;

    if (target.contactIds.length === 0 && target.groupIds.length === 0) {
        return fail('error', 'Validation', 'Sélectionnez au moins un destinataire.');
    }
    if (!isSentToNow && !input.planification?.length) {
        return fail('error', 'Validation', 'Définissez la planification du message.');
    }

    if (isCloud) {
        if (input.composeError) return fail('error', 'Validation', input.composeError);
        if (!isSentToNow && !hasTemplate) {
            return fail('error', 'Validation', 'Un message programmé doit utiliser un modèle WhatsApp approuvé.');
        }
        if (hasTemplate && !input.cloudTemplateComplete) {
            return fail('error', 'Validation', "Renseignez toutes les variables du modèle et son média d'en-tête.");
        }
        if (files.length > 1) {
            return fail('error', 'Validation', "Un message WhatsApp Business ne contient qu'un seul fichier.");
        }
    }

    if (!hasTemplate && !text && files.length === 0) {
        return fail('error', 'Validation', 'Ajoutez un texte, un fichier ou un modèle au message.');
    }
    if (text.length > WHATSAPP_TEXT_MAX_LENGTH) {
        return fail('error', 'Validation', `Le texte dépasse ${WHATSAPP_TEXT_MAX_LENGTH} caractères.`);
    }

    if (!input.costSufficient) {
        return fail(
            'warning',
            'Solde insuffisant',
            isCloud ? "Rechargez le portefeuille de l'organisation pour couvrir le coût de cet envoi." : 'Rechargez votre portefeuille pour couvrir le coût de cet envoi.',
        );
    }

    const payload: MessageModel = {
        type: MessageType.TEXT,
        isSentToNow,
        contactsID: [...target.contactIds],
        groupsID: [...target.groupIds],
    };

    if (!isSentToNow) payload.planification = input.planification as MessageModel['planification'];

    if (hasTemplate) {
        payload.template = input.cloudTemplate;
    } else if (composition.messageTemplateId) {
        payload.messageTemplateId = composition.messageTemplateId;
    } else if (text) {
        payload.bodyText = text;
    }

    if (files.length) payload.bodyFile = files;

    return { ok: true, payload };
}
