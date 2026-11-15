/**
 * Conversion du contenu riche de l'editeur (HTML Quill) en texte WhatsApp.
 *
 * WhatsApp n'interprete pas le HTML : un corps envoye tel quel arrive avec des balises
 * visibles. On garde la mise en forme que WhatsApp sait afficher :
 *   gras *texte*, italique _texte_, barre ~texte~, code ```texte```, puces "• ".
 */

const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'UL', 'OL']);

const MARKERS: Record<string, string> = {
    B: '*', STRONG: '*',
    I: '_', EM: '_',
    S: '~', STRIKE: '~', DEL: '~',
    CODE: '```',
};

const decodeEntities = (value: string): string =>
    value
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'");

/** Texte brut sans balises (repli si le DOM n'est pas disponible). */
const stripTags = (html: string): string =>
    decodeEntities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6])>/gi, '\n').replace(/<[^>]*>/g, ''));

const renderNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '').replace(/\s+/g, ' ');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const element = node as HTMLElement;
    const tag = element.tagName.toUpperCase();

    if (tag === 'BR') return '\n';

    const children = Array.from(element.childNodes).map(renderNode).join('');

    if (tag === 'LI') {
        const text = children.trim();
        return text ? `• ${text}\n` : '';
    }

    if (tag === 'A') {
        const text = children.trim();
        const href = element.getAttribute('href') || '';
        if (!href || href === text) return text;
        return text ? `${text} (${href})` : href;
    }

    const marker = MARKERS[tag];
    if (marker) {
        const inner = children;
        // Un marqueur autour d'un espace seul ou vide ne sert a rien (et casse le rendu).
        if (!inner.trim()) return inner;
        const leading = inner.match(/^\s*/)[0];
        const trailing = inner.match(/\s*$/)[0];
        return `${leading}${marker}${inner.trim()}${marker}${trailing}`;
    }

    if (BLOCK_TAGS.has(tag)) return `${children.replace(/\s+$/, '')}\n`;
    return children;
};

/** HTML de l'editeur -> texte WhatsApp. Un texte deja brut est seulement nettoye. */
export function htmlToWhatsappText(input: string | null | undefined): string
{
    const raw = String(input ?? '');
    if (!raw.trim()) return '';

    const looksLikeHtml = /<\/?[a-z][\s\S]*?>/i.test(raw);
    let text: string;

    if (!looksLikeHtml) {
        text = decodeEntities(raw);
    } else if (typeof DOMParser === 'undefined') {
        text = stripTags(raw);
    } else {
        const doc = new DOMParser().parseFromString(raw, 'text/html');
        text = Array.from(doc.body.childNodes).map(renderNode).join('');
    }

    return text
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Longueur maximale d'un message texte WhatsApp. */
export const WHATSAPP_TEXT_MAX_LENGTH = 4096;
