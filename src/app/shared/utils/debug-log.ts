import { environment } from 'environments/environment';

/**
 * Journal de debogage, silencieux en production (evite d'exposer des donnees
 * de session dans la console des utilisateurs).
 */
export const debugLog = (...args: any[]): void => {
    if ( !environment.production )
    {
        console.log(...args);
    }
};
