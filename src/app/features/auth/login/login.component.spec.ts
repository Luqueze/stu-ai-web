import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { AuthResponse } from '../../../core/auth/auth.models';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const authResponse: AuthResponse = {
    token: 'fake-jwt-token',
    expiresIn: 3600,
    user: { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'STUDENT' }
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  it('does not call login() when the form is invalid', () => {
    component.form.setValue({ email: '', password: '' });

    component.onSubmit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('calls login() and navigates to /dashboard on success', () => {
    authServiceSpy.login.and.returnValue(of(authResponse));
    component.form.setValue({ email: 'ada@example.com', password: 'password123' });

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password123'
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/exams');
    expect(component.isSubmitting()).toBeFalse();
  });

  it('sets an error message when login() fails with 401', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Invalid credentials' } }))
    );
    component.form.setValue({ email: 'ada@example.com', password: 'wrong' });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid email or password.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
