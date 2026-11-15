import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of, take } from 'rxjs';
import { OrganizationService } from './organization.service';

/** Pages reservees aux membres d'une organisation : sinon, page de creation. */
export const organizationMemberGuard: CanActivateFn = () =>
{
    const router = inject(Router);
    const organizations = inject(OrganizationService);
    const membership = organizations.membership;
    const decide = (value: unknown) => (value ? true : router.createUrlTree(['/organisation/overview']));
    // Adhesion pas encore chargee (acces direct par URL) : chargement.
    return membership === undefined
        ? organizations.load().pipe(map(decide))
        : organizations.loadedMembership$.pipe(take(1), map(decide));
};

/**
 * Synchronisation du WhatsApp personnel : reservee aux comptes personnels.
 * Un membre d'organisation envoie par le numero de l'organisation : redirection
 * vers la configuration WhatsApp Business. Adhesion inconnue : acces refuse.
 */
export const personalAccountGuard: CanActivateFn = () =>
{
    const router = inject(Router);
    const organizations = inject(OrganizationService);
    const decide = (membership: unknown) =>
    {
        if (membership === undefined) return router.createUrlTree(['/organisation/overview']);
        return membership ? router.createUrlTree(['/organisation/whatsapp']) : true;
    };
    return organizations.membership === undefined
        ? organizations.load().pipe(map(decide))
        : of(decide(organizations.membership));
};
