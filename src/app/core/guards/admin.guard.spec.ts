import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { UserResponse } from '../auth/auth.models';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function withUser(user: UserResponse | null): void {
    Object.defineProperty(authServiceSpy, 'currentUser', { value: () => user, configurable: true });
  }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    withUser(null);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('allows activation for an ADMIN user', () => {
    withUser({ id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'ADMIN' });

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to /exams for a non-ADMIN user', () => {
    withUser({ id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'STUDENT' });
    const urlTree = {} as UrlTree;
    routerSpy.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/exams']);
    expect(result).toBe(urlTree);
  });
});
