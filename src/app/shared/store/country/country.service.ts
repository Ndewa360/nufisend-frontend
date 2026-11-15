import { Injectable } from "@angular/core";
import { CountryModel } from "./country.model";

import { BehaviorSubject, Observable, of, tap } from "rxjs";

/**
 * Liste locale des indicatifs pays (le backend n'expose pas de route pays).
 * Le Cameroun est en tete : c'est le pays par defaut des numeros sans indicatif.
 * `flagImagePos` n'est pas connu localement : le drapeau sprite n'est pas affiche correctement.
 */
export const FALLBACK_COUNTRIES: CountryModel[] = [
    { id: 'CM', iso: 'CM', name: 'Cameroun', code: '+237', flagImagePos: '' },
    { id: 'FR', iso: 'FR', name: 'France', code: '+33', flagImagePos: '' },
    { id: 'BE', iso: 'BE', name: 'Belgique', code: '+32', flagImagePos: '' },
    { id: 'CH', iso: 'CH', name: 'Suisse', code: '+41', flagImagePos: '' },
    { id: 'CA', iso: 'CA', name: 'Canada', code: '+1', flagImagePos: '' },
    { id: 'US', iso: 'US', name: 'Etats-Unis', code: '+1', flagImagePos: '' },
    { id: 'GB', iso: 'GB', name: 'Royaume-Uni', code: '+44', flagImagePos: '' },
    { id: 'DE', iso: 'DE', name: 'Allemagne', code: '+49', flagImagePos: '' },
    { id: 'ES', iso: 'ES', name: 'Espagne', code: '+34', flagImagePos: '' },
    { id: 'IT', iso: 'IT', name: 'Italie', code: '+39', flagImagePos: '' },
    { id: 'PT', iso: 'PT', name: 'Portugal', code: '+351', flagImagePos: '' },
    { id: 'NL', iso: 'NL', name: 'Pays-Bas', code: '+31', flagImagePos: '' },
    { id: 'SN', iso: 'SN', name: 'Senegal', code: '+221', flagImagePos: '' },
    { id: 'CI', iso: 'CI', name: "Cote d'Ivoire", code: '+225', flagImagePos: '' },
    { id: 'GA', iso: 'GA', name: 'Gabon', code: '+241', flagImagePos: '' },
    { id: 'CG', iso: 'CG', name: 'Congo', code: '+242', flagImagePos: '' },
    { id: 'CD', iso: 'CD', name: 'RD Congo', code: '+243', flagImagePos: '' },
    { id: 'TD', iso: 'TD', name: 'Tchad', code: '+235', flagImagePos: '' },
    { id: 'CF', iso: 'CF', name: 'Centrafrique', code: '+236', flagImagePos: '' },
    { id: 'GQ', iso: 'GQ', name: 'Guinee equatoriale', code: '+240', flagImagePos: '' },
    { id: 'NG', iso: 'NG', name: 'Nigeria', code: '+234', flagImagePos: '' },
    { id: 'GH', iso: 'GH', name: 'Ghana', code: '+233', flagImagePos: '' },
    { id: 'ML', iso: 'ML', name: 'Mali', code: '+223', flagImagePos: '' },
    { id: 'BF', iso: 'BF', name: 'Burkina Faso', code: '+226', flagImagePos: '' },
    { id: 'BJ', iso: 'BJ', name: 'Benin', code: '+229', flagImagePos: '' },
    { id: 'TG', iso: 'TG', name: 'Togo', code: '+228', flagImagePos: '' },
    { id: 'MA', iso: 'MA', name: 'Maroc', code: '+212', flagImagePos: '' },
    { id: 'DZ', iso: 'DZ', name: 'Algerie', code: '+213', flagImagePos: '' },
    { id: 'TN', iso: 'TN', name: 'Tunisie', code: '+216', flagImagePos: '' },
    { id: 'EG', iso: 'EG', name: 'Egypte', code: '+20', flagImagePos: '' },
    { id: 'ZA', iso: 'ZA', name: 'Afrique du Sud', code: '+27', flagImagePos: '' },
    { id: 'KE', iso: 'KE', name: 'Kenya', code: '+254', flagImagePos: '' },
    { id: 'BR', iso: 'BR', name: 'Bresil', code: '+55', flagImagePos: '' },
    { id: 'CN', iso: 'CN', name: 'Chine', code: '+86', flagImagePos: '' },
    { id: 'IN', iso: 'IN', name: 'Inde', code: '+91', flagImagePos: '' },
    { id: 'AE', iso: 'AE', name: 'Emirats arabes unis', code: '+971', flagImagePos: '' },
];

@Injectable({
    providedIn: 'root'
})
export class CountryService
{
    private _countries: BehaviorSubject<CountryModel[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor()
    {}

    /**
     * Get countries (liste locale, sans appel HTTP)
     */
    getCountries():Observable<CountryModel[]>
    {
        return of(FALLBACK_COUNTRIES).pipe(
            tap((countries) => {
                this._countries.next(countries);
            })
        );
    }

    /**
     * Getter for countries
     */
    get countries$(): Observable<CountryModel[]>
    {
        return this._countries.asObservable();
    }
}
