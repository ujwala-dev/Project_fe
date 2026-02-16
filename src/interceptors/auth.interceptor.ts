import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip interceptor for auth endpoints (login/register)
  const isAuthEndpoint =
    req.url.includes('/Auth/login') || req.url.includes('/Auth/register');

  if (isAuthEndpoint) {
    return next(req);
  }

  // Get token from localStorage
  let token: string | null = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      token = window.localStorage.getItem('authToken');
      console.log(
        'Auth Interceptor - Token retrieved:',
        token
          ? 'Token exists (length: ' + token.length + ')'
          : 'No token found',
      );

      // Check token format and expiration
      if (token) {
        const parts = token.split('.');
        console.log('Auth Interceptor - Token parts count:', parts.length);

        if (parts.length !== 3) {
          console.error(
            'Auth Interceptor - Invalid JWT format! Token should have 3 parts (header.payload.signature)',
          );
          console.log('Auth Interceptor - Token value:', token);
          console.warn(
            'Auth Interceptor - Please log in again to get a valid token',
          );
        } else {
          try {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map(
                  (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2),
                )
                .join(''),
            );
            const payload = JSON.parse(jsonPayload);
            const exp = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const isExpired = now > exp;
            console.log(
              'Auth Interceptor - Token expiration:',
              new Date(exp).toLocaleString(),
            );
            console.log(
              'Auth Interceptor - Current time:',
              new Date(now).toLocaleString(),
            );
            console.log('Auth Interceptor - Token expired:', isExpired);

            if (isExpired) {
              console.warn(
                'Auth Interceptor - Token has expired! Please log in again',
              );
            }
          } catch (e) {
            console.error('Auth Interceptor - Error decoding token:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error retrieving token:', error);
  }

  // Clone the request and add authorization header if token exists
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Auth Interceptor - Authorization header added');
    return next(clonedRequest);
  }

  return next(req);
};
