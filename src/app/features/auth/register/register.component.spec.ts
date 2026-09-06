import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { AuthResponse } from '../../../core/auth/auth.models';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const authResponse: AuthResponse = {
    token: 'fake-jwt-token',
    expiresIn: 3600,
    user: { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'STUDENT' }
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  it('does not call register() when the form is invalid', () => {
    component.form.setValue({ name: '', email: '', password: '' });

    component.onSubmit();

    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('calls register() and navigates to /dashboard on success', () => {
    authServiceSpy.register.and.returnValue(of(authResponse));
    component.form.setValue({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'password123' });

    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123'
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/exams');
    expect(component.isSubmitting()).toBeFalse();
  });

  it('sets an error message when register() fails with 409', () => {
    authServiceSpy.register.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Email already registered' } }))
    );
    component.form.setValue({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'password123' });

    component.onSubmit();

    expect(component.errorMessage()).toBe('An account with this email already exists.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
