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
  readonly flags = signal<boolean[]>([]);
  readonly remainingSeconds = signal(0);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly currentIndex = signal(0);

  readonly allAnswered = computed(() => this.answers().every((a) => a !== null));
  readonly answeredCount = computed(() => this.answers().filter((a) => a !== null).length);
  readonly isFirstQuestion = computed(() => this.currentIndex() === 0);
  readonly isLastQuestion = computed(() => this.currentIndex() === (this.exam()?.questions?.length ?? 1) - 1);

  readonly formattedTime = computed(() => {
    const total = this.remainingSeconds();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  ngOnInit(): void {
    // Starts the session before fetching the exam: the backend only redacts the answer key
    // while the student has no active session, so fetching first would leak it on a retake.
    this.startSession();
  }

  private startSession(): void {
    this.examService.startSession(this.examId).subscribe({
      next: (session) => {
        this.remainingSeconds.set(session.remainingSeconds);
        this.loadExam();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.mapError(err));
      }
    });
  }

  private loadExam(): void {
    this.examService.getExam(this.examId).subscribe({
      next: (exam) => {
        this.exam.set(exam);
        this.answers.set(new Array(exam.questions?.length ?? 0).fill(null));
        this.flags.set(new Array(exam.questions?.length ?? 0).fill(false));
        this.isLoading.set(false);
        this.startTimer();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Could not load this exam.');
      }
    });
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

  toggleFlag(questionIndex: number): void {
    const next = [...this.flags()];
    next[questionIndex] = !next[questionIndex];
    this.flags.set(next);
  }

  goToNext(): void {
    if (this.isLastQuestion()) {
      return;
    }
    this.currentIndex.update((i) => i + 1);
  }

  goToQuestion(index: number): void {
    this.currentIndex.set(index);
  }

  goToPrevious(): void {
    if (this.isFirstQuestion()) {
      return;
    }
    this.currentIndex.update((i) => i - 1);
  }

  onSubmit(): void {
    if (this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const selectedOptions = this.answers().map((a) => a ?? -1);
    const flaggedQuestions = this.flags();
    this.examService.submitExam(this.examId, { selectedOptions, flaggedQuestions }).subscribe({
      next: () => {
        void this.router.navigate(['/exams', this.examId]);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
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
