import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ExamService } from '../../../core/exam/exam.service';
import { ErrorResponse } from '../../../core/auth/auth.models';

@Component({
  selector: 'app-exam-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './exam-create.component.html',
  styleUrl: './exam-create.component.scss'
})
export class ExamCreateComponent {
  private readonly examService = inject(ExamService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  readonly form = this.formBuilder.group({
    theme: ['', [Validators.required]],
    questionCount: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
    difficulty: ['MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD', [Validators.required]],
    durationMinutes: [30, [Validators.required, Validators.min(1), Validators.max(480)]]
  });

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.examService.createExam(this.form.getRawValue()).subscribe({
      next: (exam) => {
        this.isSubmitting.set(false);
        void this.router.navigate(['/exams', exam.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.mapError(err));
      }
    });
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 403) {
      return "You don't have permission to create exams.";
    }
    const body = err.error as Partial<ErrorResponse> | null;
    return body?.message ?? 'Something went wrong. Please try again.';
  }
}
