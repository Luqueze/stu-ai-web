import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['forgotPassword']);

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
  });

  it('does not call forgotPassword() when the form is invalid', () => {
    component.form.setValue({ email: '' });

    component.onSubmit();

    expect(authServiceSpy.forgotPassword).not.toHaveBeenCalled();
  });

  it('shows the confirmation state after a successful request', () => {
    authServiceSpy.forgotPassword.and.returnValue(of(undefined));
    component.form.setValue({ email: 'ada@example.com' });

    component.onSubmit();

    expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith({ email: 'ada@example.com' });
    expect(component.isSubmitted()).toBeTrue();
    expect(component.isSubmitting()).toBeFalse();
  });

  it('shows the same confirmation state even when the request fails', () => {
    authServiceSpy.forgotPassword.and.returnValue(throwError(() => new Error('network error')));
    component.form.setValue({ email: 'ada@example.com' });

    component.onSubmit();

    expect(component.isSubmitted()).toBeTrue();
  });
});
