import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  async function createComponent(queryParams: Record<string, string>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['resetPassword']);
  });

  it('treats a missing token as an invalid link and does not submit', async () => {
    await createComponent({});

    component.onSubmit();

    expect(component.token).toBeNull();
    expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('does not call resetPassword() when the form is invalid', async () => {
    await createComponent({ token: 'abc123' });

    component.form.setValue({ newPassword: 'short' });
    component.onSubmit();

    expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('calls resetPassword() and navigates to /login on success', async () => {
    await createComponent({ token: 'abc123' });
    authServiceSpy.resetPassword.and.returnValue(of(undefined));

    component.form.setValue({ newPassword: 'newPassword123' });
    component.onSubmit();

    expect(authServiceSpy.resetPassword).toHaveBeenCalledWith({
      token: 'abc123',
      newPassword: 'newPassword123'
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('sets an error message when resetPassword() fails with 400', async () => {
    await createComponent({ token: 'abc123' });
    authServiceSpy.resetPassword.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Invalid or expired reset token' } }))
    );

    component.form.setValue({ newPassword: 'newPassword123' });
    component.onSubmit();

    expect(component.errorMessage()).toBe(
      'This reset link is invalid or has expired. Please request a new one.'
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
