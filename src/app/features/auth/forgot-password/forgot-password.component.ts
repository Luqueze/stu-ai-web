import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]]
  });

  readonly isSubmitting = signal(false);
  readonly isSubmitted = signal(false);

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: () => this.finishSubmission(),
      error: () => this.finishSubmission()
    });
  }

  private finishSubmission(): void {
    this.isSubmitting.set(false);
    this.isSubmitted.set(true);
  }
}
