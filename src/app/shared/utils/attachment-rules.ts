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
