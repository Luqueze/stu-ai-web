import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AuthResponse, ErrorResponse } from './auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const authResponse: AuthResponse = {
    token: 'fake-jwt-token',
    expiresIn: 3600,
    user: { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'STUDENT' }
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts unauthenticated when localStorage is empty', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('login() stores the session and exposes the current user on success', () => {
    service.login({ email: 'ada@example.com', password: 'password123' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(authResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getToken()).toBe('fake-jwt-token');
    expect(service.currentUser()).toEqual(authResponse.user);
    expect(localStorage.getItem('stu_auth_session')).toContain('fake-jwt-token');
  });

  it('login() surfaces an error and leaves state unauthenticated on 401', () => {
    const errorBody: ErrorResponse = {
      status: 401,
      message: 'Invalid credentials',
      timestamp: new Date().toISOString(),
      path: '/api/v1/auth/login'
    };
    let receivedError: unknown;

    service.login({ email: 'ada@example.com', password: 'wrong' }).subscribe({
      error: (err) => (receivedError = err)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/auth/login`);
    req.flush(errorBody, { status: 401, statusText: 'Unauthorized' });

    expect(receivedError).toBeTruthy();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('register() stores the session on success', () => {
    service.register({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'password123' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(authResponse, { status: 201, statusText: 'Created' });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()?.email).toBe('ada@example.com');
  });

  it('register() surfaces a 409 conflict error on duplicate email', () => {
    const errorBody: ErrorResponse = {
      status: 409,
      message: 'Email already registered',
      timestamp: new Date().toISOString(),
      path: '/api/v1/auth/register'
    };
    let receivedError: unknown;

    service.register({ name: 'Ada', email: 'ada@example.com', password: 'password123' }).subscribe({
      error: (err) => (receivedError = err)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/auth/register`);
    req.flush(errorBody, { status: 409, statusText: 'Conflict' });

    expect(receivedError).toBeTruthy();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('logout() clears the stored session', () => {
    service.login({ email: 'ada@example.com', password: 'password123' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/v1/auth/login`).flush(authResponse);
    expect(service.isAuthenticated()).toBeTrue();

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('stu_auth_session')).toBeNull();
  });
});
