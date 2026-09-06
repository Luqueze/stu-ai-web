import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let nextSpy: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    });

    nextSpy = jasmine.createSpy('next').and.callFake((req: HttpRequest<unknown>) => of(req)) as unknown as jasmine.Spy<HttpHandlerFn>;
  });

  function run(req: HttpRequest<unknown>): void {
    TestBed.runInInjectionContext(() => authInterceptor(req, nextSpy));
  }

  it('attaches the Authorization header when a token is present for a non-auth request', () => {
    authServiceSpy.getToken.and.returnValue('fake-jwt-token');
    const req = new HttpRequest('GET', '/api/v1/exams');

    run(req);

    const forwardedRequest = nextSpy.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedRequest.headers.get('Authorization')).toBe('Bearer fake-jwt-token');
  });

  it('does not attach an Authorization header when there is no token', () => {
    authServiceSpy.getToken.and.returnValue(null);
    const req = new HttpRequest('GET', '/api/v1/exams');

    run(req);

    const forwardedRequest = nextSpy.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedRequest.headers.has('Authorization')).toBeFalse();
  });

  it('does not attach an Authorization header on the login endpoint even with a token present', () => {
    authServiceSpy.getToken.and.returnValue('fake-jwt-token');
    const req = new HttpRequest('POST', '/api/v1/auth/login', {});

    run(req);

    expect(authServiceSpy.getToken).not.toHaveBeenCalled();
    const forwardedRequest = nextSpy.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedRequest.headers.has('Authorization')).toBeFalse();
  });

  it('does not attach an Authorization header on the register endpoint even with a token present', () => {
    authServiceSpy.getToken.and.returnValue('fake-jwt-token');
    const req = new HttpRequest('POST', '/api/v1/auth/register', {});

    run(req);

    expect(authServiceSpy.getToken).not.toHaveBeenCalled();
  });
});
