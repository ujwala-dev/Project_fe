import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { User, UserRole } from '../models/model';
import { HttpClient } from '@angular/common/http';
import { map, tap, catchError } from 'rxjs/operators';

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
  }): Observable<any> {
    console.log('Auth Service - Register request:', {
      ...payload,
      password: '***',
    });
    console.log('Auth Service - API URL:', `${this.apiUrl}/register`);
    return this.http
      .post<any>(`${this.apiUrl}/register`, payload)
      .pipe(
        tap((response) =>
          console.log('Auth Service - Register response:', response),
        ),
      );
  }

  // Login user and store JWT token
  loginWithCredentials(email: string, password: string): Observable<User> {
    const loginPayload = { email, password };
    console.log('Auth Service - Login request:', { email, password: '***' });
    console.log('Auth Service - API URL:', `${this.apiUrl}/login`);

    return this.http.post<any>(`${this.apiUrl}/login`, loginPayload).pipe(
      tap((response: any) => {
        console.log('Login response from backend:', response);
        // Extract token from new response structure: { success, message, data: { token, ... } }
        const token = response.data?.token || response.token;
        console.log('Extracted token:', token ? 'Token exists' : 'No token');

        // Store JWT token
        try {
          if (token && typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('authToken', token);
            console.log('Token stored in localStorage');
          }
        } catch (error) {
          console.error('Error storing token:', error);
        }
      }),
      map((response: any) => {
        // Extract token from new response structure
        const token = response.data?.token || response.token;

        if (!token) {
          throw new Error('No token received from server');
        }

        // Decode JWT to get user info
        const payload = this.decodeJWT(token);

        // Create user object from JWT payload and response data
        const responseData = response.data || {};
        const user: User = {
          userID: responseData.userId || payload.sub || Date.now(),
          name:
            responseData.name ||
            payload[
              'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
            ] ||
            payload.name ||
            'User',
          email: responseData.email || payload.email || email,
          role: this.normalizeRole(
            responseData.role ||
              payload[
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
              ] ||
              payload.role ||
              'employee',
          ),
          status: (responseData.status || payload.status || 'Active') as
            | 'Active'
            | 'Inactive',
          department: payload.department,
        };

        // Store user in service
        this.login(user);

        return user;
      }),
      catchError((error) => {
        console.error('Auth Service - Login error in map operator:', error);
        return throwError(() => error);
      }),
    );
  }

  // Helper function to decode JWT token
  private decodeJWT(token: string): any {
    try {
      if (!token || typeof token !== 'string') {
        console.error('Invalid token:', token);
        return {};
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format');
        return {};
      }

      const base64Url = parts[1];
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
  private normalizeRole(role: any): UserRole {
    // Handle numeric roles from backend: 2 = Admin, 1 = Manager, 0 = Employee
    if (typeof role === 'number') {
      if (role === 2) return UserRole.ADMIN;
      if (role === 1) return UserRole.MANAGER;
      return UserRole.EMPLOYEE;
    }

    // Handle string roles
    const roleLower = String(role).toLowerCase();
    if (roleLower === 'admin') return UserRole.ADMIN;
    if (roleLower === 'manager') return UserRole.MANAGER;
    return UserRole.EMPLOYEE;
  }
}
