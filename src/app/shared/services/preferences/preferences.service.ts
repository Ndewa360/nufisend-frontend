import { Injectable } from "@angular/core";

export interface WorkspacePreferences {
    timezone: string;
    defaultCountry: string;
}

export const DEFAULT_TIMEZONE = "Africa/Douala";

const STORAGE_KEY = "nufisend.workspace.preferences";

@Injectable({
    providedIn: "root"
})
export class PreferencesService
{
    get(): WorkspacePreferences
    {
        const fallback: WorkspacePreferences = {
            // Fuseau du produit par defaut : les planifications s'executent dans ce fuseau,
            // quel que soit le reglage du navigateur (le backend utilise le meme defaut).
            timezone: DEFAULT_TIMEZONE,
            defaultCountry: "cm"
        };

        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            return { ...fallback, ...(stored || {}) };
        } catch {
            return fallback;
        }
    }

    save(preferences: Partial<WorkspacePreferences>): WorkspacePreferences
    {
        const next = { ...this.get(), ...preferences };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
    }
}
