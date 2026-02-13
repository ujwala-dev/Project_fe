import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/model';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrl: './notification.css',
})
export class NotificationComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);

  notificationDropdownOpen = signal(false);
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);

  private subs: Subscription[] = [];

  ngOnInit(): void {
    console.log('[NotificationComponent] Initializing...');

    // Subscribe to notifications
    this.subs.push(
      this.notificationService.notifications$.subscribe((notifications) => {
        console.log(
          '[NotificationComponent] Received notifications update:',
          notifications,
        );
        console.log('[NotificationComponent] Count:', notifications.length);
        this.notifications.set(notifications);
      }),
    );

    // Subscribe to unread count
    this.subs.push(
      this.notificationService.unreadCount$.subscribe((count) => {
        console.log('[NotificationComponent] Unread count:', count);
        this.unreadCount.set(count);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  toggleNotificationDropdown(): void {
    this.notificationDropdownOpen.set(!this.notificationDropdownOpen());
  }

  closeNotificationDropdown(): void {
    this.notificationDropdownOpen.set(false);
  }

  markAsRead(notificationID: string): void {
    this.notificationService.markAsRead(notificationID);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'NewIdea':
        return '💡';
      case 'ReviewDecision':
        return '✅';
      case 'NewComment':
        return '💬';
      default:
        return '🔔';
    }
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closeNotificationDropdown();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const inNotificationDropdown = target.closest(
      '[data-notification-dropdown]',
    );
    if (!inNotificationDropdown) this.closeNotificationDropdown();
  }
}
