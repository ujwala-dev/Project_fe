import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap, catchError, of } from 'rxjs';
import { Notification, NotificationResponse } from '../models/model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'https://localhost:7175/api/Notification';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private pollingInterval: any = null;
  private readonly POLL_INTERVAL = 10000; // Poll every 10 seconds

  // Observable streams
  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.notifications$.pipe(
    map(
      (notifications) =>
        notifications.filter((n) => n.status === 'Unread').length,
    ),
  );

  constructor() {
    this.loadNotifications();
    this.startPolling();
  }

  /**
   * Load notifications from backend API
   * GET /api/Notification
   */
  private loadNotifications(): void {
    const currentUser = this.auth.getCurrentUser();
    console.log(
      '[NotificationService] Loading notifications for user:',
      currentUser,
    );

    if (!currentUser) {
      console.log(
        '[NotificationService] No user logged in, skipping notification load',
      );
      return;
    }

    // Check token
    const token = this.auth.getToken();
    console.log('[NotificationService] Auth token exists:', !!token);
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
          );
          console.log('[NotificationService] JWT payload:', payload);
          console.log(
            '[NotificationService] User ID from JWT (sub):',
            payload.sub,
          );
          console.log(
            '[NotificationService] User role from JWT:',
            payload.role,
          );
        }
      } catch (e) {
        console.error('[NotificationService] Error decoding JWT:', e);
      }
    }

    console.log('[NotificationService] Fetching from:', this.apiUrl);

    this.http
      .get<NotificationResponse[]>(this.apiUrl, { observe: 'response' })
      .pipe(
        tap((response) => {
          console.log('[NotificationService] Full HTTP Response:', response);
          console.log(
            '[NotificationService] Response status:',
            response.status,
          );
          console.log(
            '[NotificationService] Response headers:',
            response.headers,
          );
          console.log('[NotificationService] Response body:', response.body);
        }),
        map((response) => response.body || []),
        tap((responses) => {
          console.log('[NotificationService] Raw backend response:', responses);
          console.log(
            '[NotificationService] Response count:',
            responses?.length || 0,
          );
          if (responses && responses.length > 0) {
            console.log(
              '[NotificationService] First notification:',
              responses[0],
            );
          }
        }),
        map((responses) => this.mapNotifications(responses)),
        tap((notifications) => {
          console.log(
            '[NotificationService] Mapped notifications:',
            notifications,
          );
          console.log(
            '[NotificationService] Mapped count:',
            notifications.length,
          );
        }),
        catchError((error) => {
          console.error(
            '[NotificationService] Error loading notifications:',
            error,
          );
          console.error('[NotificationService] Error status:', error.status);
          console.error('[NotificationService] Error message:', error.message);
          return of([]);
        }),
      )
      .subscribe((notifications) => {
        console.log(
          '[NotificationService] Setting notifications in subject:',
          notifications,
        );
        this.notificationsSubject.next(notifications);
      });
  }

  /**
   * Map backend notification response to frontend model
   */
  private mapNotifications(responses: NotificationResponse[]): Notification[] {
    return responses.map((r) => ({
      notificationID: r.notificationId,
      userID: r.userId,
      type: r.type as 'NewIdea' | 'ReviewDecision' | 'NewComment',
      message: r.message,
      status: r.status as 'Unread' | 'Read',
      createdDate: r.createdDate,
      relatedIdeaID: r.ideaId,
      relatedUserName: r.reviewerName,
      ideaTitle: r.ideaTitle,
      reviewerId: r.reviewerId,
      reviewerName: r.reviewerName,
    }));
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  /**
   * Mark notification as read
   * PUT /api/Notification/{notificationId}/read
   */
  markAsRead(notificationID: string): void {
    this.http
      .put(`${this.apiUrl}/${notificationID}/read`, {})
      .pipe(
        tap(() => {
          // Update local state optimistically
          const notifications = this.notificationsSubject.value;
          const updated = notifications.map((n) =>
            n.notificationID === notificationID
              ? { ...n, status: 'Read' as const }
              : n,
          );
          this.notificationsSubject.next(updated);
        }),
        catchError((error) => {
          console.error('Error marking notification as read:', error);
          return of(null);
        }),
      )
      .subscribe();
  }

  /**
   * Mark all notifications as read
   * PUT /api/Notification/read-all
   */
  markAllAsRead(): void {
    this.http
      .put(`${this.apiUrl}/read-all`, {})
      .pipe(
        tap(() => {
          // Update local state optimistically
          const notifications = this.notificationsSubject.value;
          const updated = notifications.map((n) => ({
            ...n,
            status: 'Read' as const,
          }));
          this.notificationsSubject.next(updated);
        }),
        catchError((error) => {
          console.error('Error marking all notifications as read:', error);
          return of(null);
        }),
      )
      .subscribe();
  }

  /**
   * Get unread count from backend
   * GET /api/Notification/unread-count
   */
  getUnreadCountFromBackend(): Observable<number> {
    return this.http
      .get<{ unreadCount: number }>(`${this.apiUrl}/unread-count`)
      .pipe(
        map((response) => response.unreadCount),
        catchError((error) => {
          console.error('Error getting unread count:', error);
          return of(0);
        }),
      );
  }

  /**
   * Delete notification
   * DELETE /api/Notification/{notificationId}
   */
  deleteNotification(notificationID: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationID}`).pipe(
      tap(() => {
        // Remove from local state
        const notifications = this.notificationsSubject.value;
        const updated = notifications.filter(
          (n) => n.notificationID !== notificationID,
        );
        this.notificationsSubject.next(updated);
      }),
      catchError((error) => {
        console.error('Error deleting notification:', error);
        return of(null);
      }),
    );
  }

  /**
   * Refresh notifications from backend
   */
  refresh(): void {
    this.loadNotifications();
  }

  /**
   * Start polling for new notifications
   */
  private startPolling(): void {
    // Only start polling if user is logged in
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) return;

    // Clear any existing interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Poll for new notifications every 10 seconds
    this.pollingInterval = setInterval(() => {
      const user = this.auth.getCurrentUser();
      if (user) {
        this.loadNotifications();
      } else {
        this.stopPolling();
      }
    }, this.POLL_INTERVAL);
  }

  /**
   * Stop polling for notifications
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Clear all notifications (local state only)
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
    this.stopPolling();
  }

  /**
   * Debug method - Log current state
   */
  debugCurrentState(): void {
    const currentUser = this.auth.getCurrentUser();
    const token = this.auth.getToken();

    console.log('=== NOTIFICATION DEBUG STATE ===');
    console.log('Current User:', currentUser);
    console.log('User ID:', currentUser?.userID);
    console.log('Token exists:', !!token);
    console.log('Current notifications:', this.notificationsSubject.value);
    console.log('API URL:', this.apiUrl);

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
          );
          console.log('JWT User ID (sub):', payload.sub);
          console.log(
            'JWT Role:',
            payload[
              'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
            ],
          );
        }
      } catch (e) {
        console.error('Error decoding JWT:', e);
      }
    }
    console.log('=== END DEBUG STATE ===');
  }
}
