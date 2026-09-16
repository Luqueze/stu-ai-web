import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ErrorResponse } from '../../../core/auth/auth.models';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  readonly token = this.route.snapshot.queryParamMap.get('token');

  readonly form = this.formBuilder.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.token || this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword({ token: this.token, newPassword: this.form.getRawValue().newPassword }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        void this.router.navigateByUrl('/login');
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.mapError(err));
      }
    });
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 400) {
      return 'This reset link is invalid or has expired. Please request a new one.';
    }
    const body = err.error as Partial<ErrorResponse> | null;
    return body?.message ?? 'Something went wrong. Please try again.';
  }
}
