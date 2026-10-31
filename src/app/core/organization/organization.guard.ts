import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
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
