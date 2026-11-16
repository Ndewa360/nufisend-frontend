import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';

/** Evenements WebSocket qui signalent un changement d'envoi (avancement ou statut). */
export const CAMPAIGN_EVENTS = ['message-progress', 'message-status'] as const;

/**
 * Signal de rafraichissement des envois : emis a chaque evenement temps reel
 * (avancement d'un envoi, fin d'un envoi) et periodiquement (filet de securite,
 * par exemple si le socket est coupe ou si l'envoi est fait depuis un autre
 * processus). Le desabonnement retire les ecouteurs et arrete le minuteur.
 */
export function campaignRefresh(socket: Socket, pollMs: number): Observable<void> {
    return new Observable<void>((subscriber) => {
        const io: any = socket?.ioSocket;
        const handler = () => subscriber.next();
        CAMPAIGN_EVENTS.forEach((event) => io?.on(event, handler));
        const timer = setInterval(handler, pollMs);
        return () => {
            CAMPAIGN_EVENTS.forEach((event) => io?.off(event, handler));
            clearInterval(timer);
        };
    });
}
