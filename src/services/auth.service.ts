import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole } from '../models/model';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSub = new BehaviorSubject<User | null>(null);
  private apiUrl = 'https://localhost:7175/api/Auth';

  user$ = this.userSub.asObservable();

  constructor(private http: HttpClient) {
    this.restoreUser();
  }

  private restoreUser() {
    try {
      const hasStorage =
        typeof window !== 'undefined' &&
        window.localStorage &&
        typeof window.localStorage.getItem === 'function';
      if (hasStorage) {
        const raw = window.localStorage.getItem('currentUser');
        if (raw) {
          try {
            this.userSub.next(JSON.parse(raw));
          } catch {
            this.logout();
          }
        }
      }
    } catch {}
  }

  isLoggedIn(): boolean {
    return !!this.userSub.value;
  }

  getUserRole(): UserRole | null {
    return this.userSub.value?.role || null;
  }

  getUserName(): string | undefined {
    return this.userSub.value?.name;
  }

  getCurrentUser(): User | null {
    return this.userSub.value;
  }

  login(user: User) {
    this.userSub.next(user);
    try {
      if (
        typeof window !== 'undefined' &&
        window.localStorage &&
        typeof window.localStorage.setItem === 'function'
      ) {
        window.localStorage.setItem('currentUser', JSON.stringify(user));
      }
    } catch {}
  }

  logout() {
    this.userSub.next(null);
    try {
      if (
        typeof window !== 'undefined' &&
        window.localStorage &&
        typeof window.localStorage.removeItem === 'function'
      ) {
        window.localStorage.removeItem('currentUser');
        window.localStorage.removeItem('authToken');
        window.localStorage.removeItem('auth');
      }
    } catch {}
  }

  getToken(): string | null {
    try {
      if (
        typeof window !== 'undefined' &&
        window.localStorage &&
        typeof window.localStorage.getItem === 'function'
      ) {
        return window.localStorage.getItem('authToken');
      }
    } catch {
      return null;
    }
    return null;
  }

  // Register new user
  register(payload: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Observable<string> {
    return this.http.post(`${this.apiUrl}/register`, payload, {
      responseType: 'text',
    });
  }

  // Login user and store JWT token
  loginWithCredentials(email: string, password: string): Observable<User> {
    const loginPayload = { email, password };

    return this.http
      .post(`${this.apiUrl}/login`, loginPayload, { responseType: 'text' })
      .pipe(
        tap((token: string) => {
          // Store JWT token
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem('authToken', token);
            }
          } catch (error) {
            console.error('Error storing token:', error);
          }
        }),
        map((token: string) => {
          // Decode JWT to get user info
          const payload = this.decodeJWT(token);

          // Create user object from JWT payload
          const user: User = {
            userID: payload.sub || Date.now(),
            name:
              payload[
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
              ] ||
              payload.name ||
              'User',
            email: payload.email || email,
            role: this.normalizeRole(
              payload[
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
              ] ||
                payload.role ||
                'employee',
            ),
            status: (payload.status || 'Active') as 'Active' | 'Inactive',
            joinedDate: new Date().toISOString(),
            department: payload.department,
            lastLoginDate: new Date().toISOString(),
          };

          // Store user in service
          this.login(user);

          return user;
        }),
      );
  }

  // Helper function to decode JWT token
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return {};
    }
  }

  // Normalize role to match UserRole enum
  private normalizeRole(role: string): UserRole {
    const roleLower = String(role).toLowerCase();
    if (roleLower === 'admin') return UserRole.ADMIN;
    if (roleLower === 'manager') return UserRole.MANAGER;
    return UserRole.EMPLOYEE;
  }
}
