import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse } from '../../../core/exam/exam.models';
import { ErrorResponse } from '../../../core/auth/auth.models';

@Component({
  selector: 'app-exam-take',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './exam-take.component.html',
  styleUrl: './exam-take.component.scss'
})
export class ExamTakeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly examService = inject(ExamService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly examId = this.route.snapshot.paramMap.get('id') ?? '';
  private timerSubscription: Subscription | null = null;

  readonly exam = signal<ExamResponse | null>(null);
  readonly answers = signal<(number | null)[]>([]);
  readonly remainingSeconds = signal(0);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly allAnswered = computed(() => this.answers().every((a) => a !== null));
  readonly answeredCount = computed(() => this.answers().filter((a) => a !== null).length);

  readonly formattedTime = computed(() => {
    const total = this.remainingSeconds();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  ngOnInit(): void {
    this.examService.getExam(this.examId).subscribe({
      next: (exam) => {
        if (exam.status !== 'READY') {
          this.isLoading.set(false);
          this.errorMessage.set('This exam is not ready to be taken yet.');
          return;
        }
        this.exam.set(exam);
        this.answers.set(new Array(exam.questions?.length ?? 0).fill(null));
        this.startSession();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Could not load this exam.');
      }
    });
  }

  private startSession(): void {
    this.examService.startSession(this.examId).subscribe({
      next: (session) => {
        this.remainingSeconds.set(session.remainingSeconds);
        this.isLoading.set(false);
        this.startTimer();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 409 && this.hasSubmission(err)) {
          void this.router.navigate(['/exams', this.examId]);
          return;
        }
        this.errorMessage.set(this.mapError(err));
      }
    });
  }

  private hasSubmission(err: HttpErrorResponse): boolean {
    const body = err.error as Partial<ErrorResponse> | null;
    return (body?.message ?? '').toLowerCase().includes('already been submitted');
  }

  private startTimer(): void {
    this.timerSubscription = interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const next = this.remainingSeconds() - 1;
        this.remainingSeconds.set(Math.max(next, 0));
        if (next <= 0) {
          this.timerSubscription?.unsubscribe();
          this.onSubmit();
        }
      });
  }

  selectOption(questionIndex: number, optionIndex: number): void {
    if (this.isSubmitting()) {
      return;
    }
    const next = [...this.answers()];
    next[questionIndex] = optionIndex;
    this.answers.set(next);
  }

  onSubmit(): void {
    if (this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const selectedOptions = this.answers().map((a) => a ?? -1);
    this.examService.submitExam(this.examId, { selectedOptions }).subscribe({
      next: () => {
        void this.router.navigate(['/exams', this.examId]);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (err.status === 409 && this.hasSubmission(err)) {
          void this.router.navigate(['/exams', this.examId]);
          return;
        }
        this.errorMessage.set(this.mapError(err));
      }
    });
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 403) {
      return "You don't have permission to take this exam.";
    }
    if (err.status === 404) {
      return 'Your session has expired. Please start the exam again.';
    }
    const body = err.error as Partial<ErrorResponse> | null;
    return body?.message ?? 'Something went wrong. Please try again.';
  }
}
