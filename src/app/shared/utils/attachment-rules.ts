/**
 * Pieces jointes d'un message : memes regles que le backend
 * (backend/src/message/utils/attachment-rules.ts), verifiees avant l'envoi
 * pour signaler tout de suite un fichier refuse.
 */
export type AttachmentKind = 'image' | 'video' | 'audio' | 'document';

const MB = 1024 * 1024;

export const ATTACHMENT_LIMITS = {
    maxFiles      : 10,
    maxBytesByKind: { image: 10 * MB, video: 10 * MB, audio: 10 * MB, document: 10 * MB } as Record<AttachmentKind, number>,
    maxTotalBytes : 30 * MB,
};

const KIND_BY_EXTENSION: Record<string, AttachmentKind> = {
    '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.gif': 'image', '.webp': 'image',
    '.mp4': 'video', '.3gp': 'video',
    '.mp3': 'audio', '.ogg': 'audio', '.opus': 'audio', '.m4a': 'audio', '.aac': 'audio', '.amr': 'audio',
    '.pdf': 'document', '.doc': 'document', '.docx': 'document', '.xls': 'document', '.xlsx': 'document',
    '.ppt': 'document', '.pptx': 'document', '.txt': 'document', '.csv': 'document',
};

/** Valeur de l'attribut `accept` du selecteur de fichiers. */
export const ATTACHMENT_ACCEPT = Object.keys(KIND_BY_EXTENSION).join(',');

export const ATTACHMENT_HINT =
    `Images, vidéos (MP4, 3GP), audios (MP3, OGG, M4A, AAC…) et documents · ${ATTACHMENT_LIMITS.maxFiles} fichiers max., 10 Mo par fichier, 30 Mo au total`;

const KIND_LABELS: Record<AttachmentKind, string> = {
    image: 'Une image', video: 'Une vidéo', audio: 'Un audio', document: 'Un document',
};

export const attachmentKindOf = (file: File): AttachmentKind | null =>
{
    const name = String(file?.name || '').toLowerCase();
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? KIND_BY_EXTENSION[name.slice(dot)] ?? null : null;
};

const toMb = (bytes: number) => `${Math.round((bytes / MB) * 10) / 10} Mo`;

/**
 * Ajoute `added` a `current` en ecartant les fichiers refuses ; retourne la
 * liste retenue et un message par fichier refuse.
 */
export const validateAttachments = (current: File[], added: File[]): { accepted: File[]; errors: string[] } =>
{
    const accepted = [...current];
    const errors: string[] = [];
    let total = accepted.reduce((sum, file) => sum + file.size, 0);

    for (const file of added)
    {
        const kind = attachmentKindOf(file);
        if (!kind)
        {
            errors.push(`${file.name} : type de fichier non pris en charge.`);
            continue;
        }
        const max = ATTACHMENT_LIMITS.maxBytesByKind[kind];
        if (file.size > max)
        {
            errors.push(`${file.name} : ${KIND_LABELS[kind].toLowerCase()} ne doit pas dépasser ${toMb(max)} (${toMb(file.size)}).`);
            continue;
        }
        if (accepted.length >= ATTACHMENT_LIMITS.maxFiles)
        {
            errors.push(`${file.name} : ${ATTACHMENT_LIMITS.maxFiles} fichiers maximum par message.`);
            continue;
        }
        if (total + file.size > ATTACHMENT_LIMITS.maxTotalBytes)
        {
            errors.push(`${file.name} : les fichiers d'un message ne doivent pas dépasser ${toMb(ATTACHMENT_LIMITS.maxTotalBytes)} au total.`);
            continue;
        }
        accepted.push(file);
        total += file.size;
    }
    return { accepted, errors };
};

/**
 * Formats et tailles acceptes par l'API WhatsApp Cloud (miroir de
 * backend/src/message/utils/attachment-rules.ts : CLOUD_MEDIA_RULES).
 */
const MB_CLOUD = 1024 * 1024;
const CLOUD_MEDIA_RULES: Record<string, { label: string; maxBytes: number }> = {
    'image/jpeg': { label: 'JPEG', maxBytes: 5 * MB_CLOUD },
    'image/png': { label: 'PNG', maxBytes: 5 * MB_CLOUD },
    'video/mp4': { label: 'MP4', maxBytes: 16 * MB_CLOUD },
    'video/3gpp': { label: '3GPP', maxBytes: 16 * MB_CLOUD },
    'audio/aac': { label: 'AAC', maxBytes: 16 * MB_CLOUD },
    'audio/amr': { label: 'AMR', maxBytes: 16 * MB_CLOUD },
    'audio/mpeg': { label: 'MP3', maxBytes: 16 * MB_CLOUD },
    'audio/mp4': { label: 'M4A', maxBytes: 16 * MB_CLOUD },
    'audio/ogg': { label: 'OGG (Opus)', maxBytes: 16 * MB_CLOUD },
    'application/pdf': { label: 'PDF', maxBytes: 100 * MB_CLOUD },
    'application/msword': { label: 'Word', maxBytes: 100 * MB_CLOUD },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'Word', maxBytes: 100 * MB_CLOUD },
    'application/vnd.ms-excel': { label: 'Excel', maxBytes: 100 * MB_CLOUD },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { label: 'Excel', maxBytes: 100 * MB_CLOUD },
    'application/vnd.ms-powerpoint': { label: 'PowerPoint', maxBytes: 100 * MB_CLOUD },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { label: 'PowerPoint', maxBytes: 100 * MB_CLOUD },
    'text/plain': { label: 'Texte', maxBytes: 100 * MB_CLOUD },
};

/** MIME envoye a WhatsApp pour un fichier (d'apres l'extension), ou '' si inconnu. */
const MIME_BY_EXTENSION: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
    '.mp4': 'video/mp4', '.3gp': 'video/3gpp',
    '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.amr': 'audio/amr',
    '.pdf': 'application/pdf', '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain', '.csv': 'text/csv',
};

/** Message d'erreur si le fichier ne peut pas partir par WhatsApp Business, sinon null. */
export const cloudAttachmentErrorOf = (file: File): string | null => {
    const name = file?.name || 'fichier';
    const dot = name.lastIndexOf('.');
    const mimetype = dot >= 0 ? MIME_BY_EXTENSION[name.slice(dot).toLowerCase()] : undefined;
    const rule = mimetype ? CLOUD_MEDIA_RULES[mimetype] : undefined;
    if (!rule) return `${name} : format non pris en charge par le numéro WhatsApp Business.`;
    if (file.size > rule.maxBytes) return `${name} : ${rule.label} trop volumineux pour WhatsApp Business (maximum ${Math.round(rule.maxBytes / MB_CLOUD)} Mo).`;
    return null;
};
