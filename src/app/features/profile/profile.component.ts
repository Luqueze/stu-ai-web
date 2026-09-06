import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { ErrorResponse } from '../../core/auth/auth.models';
import { ProfileService } from '../../core/profile/profile.service';
import { ApiKeyResponse } from '../../core/profile/profile.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  readonly currentUser = this.authService.currentUser;

  readonly form = this.formBuilder.group({
    provider: ['openai', [Validators.required]],
    apiKey: ['', [Validators.required]]
  });

  readonly apiKeys = signal<ApiKeyResponse[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadApiKeys();
  }

  private loadApiKeys(): void {
    this.profileService.listApiKeys().subscribe({
      next: (apiKeys) => {
        this.apiKeys.set(apiKeys);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Could not load your saved API keys.');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.profileService.saveApiKey(this.form.getRawValue()).subscribe({
      next: (saved) => {
        this.isSubmitting.set(false);
        this.successMessage.set(`API key for ${saved.provider} saved.`);
        this.form.patchValue({ apiKey: '' });
        this.loadApiKeys();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const body = err.error as Partial<ErrorResponse> | null;
        this.errorMessage.set(body?.message ?? 'Something went wrong. Please try again.');
      }
    });
  }
}
