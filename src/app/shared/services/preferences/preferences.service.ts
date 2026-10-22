import { Injectable } from "@angular/core";

export interface WorkspacePreferences {
    timezone: string;
    defaultCountry: string;
}

const STORAGE_KEY = "nufisend.workspace.preferences";

@Injectable({
    providedIn: "root"
})
export class PreferencesService
{
    get(): WorkspacePreferences
    {
        const fallback: WorkspacePreferences = {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Douala",
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
