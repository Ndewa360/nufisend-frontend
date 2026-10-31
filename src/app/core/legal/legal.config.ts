/**
 * Informations legales affichees sur les pages /legal (mentions legales,
 * confidentialite, CGU...). A completer par l'editeur : un champ vide n'est
 * pas affiche.
 *
 * La version des documents est celle du backend (LEGAL_VERSIONS) : toute
 * modification substantielle d'un texte doit s'accompagner d'une nouvelle
 * version cote backend pour que les utilisateurs l'acceptent a nouveau.
 */
export const LEGAL_INFO = {
    serviceName       : 'NufiSend',
    websiteUrl        : 'https://nufisend.ndewa-360.com',
    editorName        : 'Ndewa360',
    /** Forme juridique et capital (ex. « SARL au capital de 1 000 000 FCFA »). */
    editorLegalForm   : '',
    /** Registre du commerce (RCCM) et numero d'identifiant unique (NIU). */
    editorRccm        : '',
    editorNiu         : '',
    editorAddress     : 'Carrefour Prison, Bangangté, Cameroun',
    editorEmail       : 'contact@ndewa-360.com',
    editorPhone       : '',
    publicationDirector: '',
    /** Responsable de la protection des donnees (DPO) ou point de contact. */
    privacyContactName : 'Responsable de la protection des données personnelles',
    privacyEmail       : 'contact@ndewa-360.com',
    /** Hebergeur des serveurs et de la base de donnees. */
    hostName          : '',
    hostAddress       : '',
    hostCountry       : '',
    /** Prestataire d'envoi des emails transactionnels. */
    emailProvider     : '',
    /** Autorite de controle (loi n° 2024/017 du 23 decembre 2024). */
    authorityName     : 'l’autorité camerounaise de protection des données à caractère personnel',
    lawReference      : 'loi n° 2024/017 du 23 décembre 2024 relative à la protection des données à caractère personnel au Cameroun',
    jurisdiction      : 'les juridictions compétentes du ressort du siège de l’éditeur',
    effectiveDate     : '1er novembre 2026',
};

export interface LegalPageLink
{
    path: string;
    title: string;
    summary: string;
    icon: string;
}

export const LEGAL_PAGES: LegalPageLink[] = [
    { path: 'mentions-legales', title: 'Mentions légales', summary: 'Éditeur, hébergeur et contact.', icon: 'heroicons_outline:identification' },
    { path: 'confidentialite', title: 'Politique de confidentialité', summary: 'Données collectées, finalités, durées et vos droits.', icon: 'heroicons_outline:shield-check' },
    { path: 'conditions-utilisation', title: "Conditions générales d'utilisation", summary: 'Règles d’utilisation du service, tarifs et responsabilités.', icon: 'heroicons_outline:document-text' },
    { path: 'cookies', title: 'Cookies et stockage local', summary: 'Ce que le site enregistre dans votre navigateur.', icon: 'heroicons_outline:finger-print' },
    { path: 'sous-traitance', title: 'Accord de sous-traitance', summary: 'Engagements de NufiSend sur les données de vos contacts.', icon: 'heroicons_outline:clipboard-check' },
    { path: 'exercer-mes-droits', title: 'Exercer mes droits', summary: 'Accès, rectification, effacement, opposition…', icon: 'heroicons_outline:hand' },
];
