import { inject as injectVercelAnalytics } from '@vercel/analytics';
import { environment } from 'environments/environment';

/** Choix de l'utilisateur (page Cookies) : mesure d'audience desactivee. */
export const ANALYTICS_OPT_OUT_KEY = 'nufisend-analytics-optout';

export const isAnalyticsOptedOut = (): boolean =>
{
    try {
        return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === '1';
    } catch {
        return false;
    }
};

export const setAnalyticsOptOut = (optOut: boolean): void =>
{
    try {
        if (optOut) localStorage.setItem(ANALYTICS_OPT_OUT_KEY, '1');
        else localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
    } catch {
        // stockage indisponible : choix non memorise
    }
};

/** Segments de chemin portant un jeton secret (lien d'invitation...). */
const SECRET_PATHS = [/^(\/invitations\/)[^/]+/];

/**
 * URL transmise a Vercel : sans query string ni fragment (jetons de
 * confirmation, de reinitialisation, email pre-rempli, redirectURL) et avec
 * les jetons de chemin masques.
 */
export const sanitizeAnalyticsUrl = (rawUrl: string): string =>
{
    try {
        const url = new URL(rawUrl, 'https://nufisend.invalid');
        let path = url.pathname;
        for (const pattern of SECRET_PATHS) path = path.replace(pattern, '$1[token]');
        return url.origin === 'https://nufisend.invalid' ? path : `${url.origin}${path}`;
    } catch {
        return rawUrl.split(/[?#]/)[0];
    }
};

/**
 * Mesure d'audience Vercel Web Analytics (frontend heberge sur Vercel) :
 * sans cookie ni identifiant persistant, visites agregees. Desactivable par
 * l'utilisateur depuis la page Cookies et stockage local.
 */
export const startAnalytics = (): void =>
{
    injectVercelAnalytics({
        framework : 'angular',
        mode      : environment.production ? 'production' : 'development',
        debug     : false,
        beforeSend: (event) =>
        {
            if (isAnalyticsOptedOut()) return null;
            return { ...event, url: sanitizeAnalyticsUrl(event.url) };
        },
    });
};
