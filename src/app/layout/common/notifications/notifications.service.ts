import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, map, of, take } from 'rxjs';
import { Notification } from 'app/layout/common/notifications/notifications.types';

export type NewNotification = Omit<Notification, 'id' | 'read' | 'time'> & {
    read?: boolean;
    time?: string;
};

@Injectable({
    providedIn: 'root'
})
export class NotificationsService
{
    private _notifications: ReplaySubject<Notification[]> = new ReplaySubject<Notification[]>(1);
    private _currentNotifications: Notification[] = [];

    /**
     * Constructor
     */
    constructor()
    {
        this._notifications.next(this._currentNotifications);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for notifications
     */
    get notifications$(): Observable<Notification[]>
    {
        return this._notifications.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all notifications
     */
    getAll(): Observable<Notification[]>
    {
        return this.notifications$.pipe(take(1));
    }

    /**
     * Create a notification
     *
     * @param notification
     */
    create(notification: NewNotification): Observable<Notification>
    {
        const newNotification: Notification = {
            ...notification,
            id  : this._generateId(),
            read: notification.read ?? false,
            time: notification.time || new Date().toISOString()
        };

        this._setNotifications([newNotification, ...this._currentNotifications]);

        return of(newNotification);
    }

    /**
     * Update the notification
     *
     * @param id
     * @param notification
     */
    update(id: string, notification: Notification): Observable<Notification>
    {
        const updatedNotification = { ...notification, id };

        this._setNotifications(
            this._currentNotifications.map((item) => item.id === id ? updatedNotification : item)
        );

        return of(updatedNotification);
    }

    /**
     * Delete the notification
     *
     * @param id
     */
    delete(id: string): Observable<boolean>
    {
        const exists = this._currentNotifications.some((notification) => notification.id === id);

        this._setNotifications(
            this._currentNotifications.filter((notification) => notification.id !== id)
        );

        return of(exists);
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): Observable<boolean>
    {
        this._setNotifications(
            this._currentNotifications.map((notification) => ({ ...notification, read: true }))
        );

        return of(true);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private _setNotifications(notifications: Notification[]): void
    {
        this._currentNotifications = notifications;
        this._notifications.next(notifications);
    }

    private _generateId(): string
    {
        if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
            return (crypto as any).randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}
