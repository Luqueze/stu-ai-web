import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { timer } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse, ExamSubmissionResponse } from '../../../core/exam/exam.models';

const POLL_INTERVAL_MS = 3000;

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './exam-detail.component.html',
  styleUrl: './exam-detail.component.scss'
})
export class ExamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly examService = inject(ExamService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly examId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');

  readonly exam = signal<ExamResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly submission = signal<ExamSubmissionResponse | null>(null);
  readonly isSubmissionLoading = signal(false);

  ngOnInit(): void {
    this.loadExam();
  }

  private loadExam(): void {
    this.examService.getExam(this.examId).subscribe({
      next: (exam) => {
        this.exam.set(exam);
        this.isLoading.set(false);
        if (exam.status === 'PENDING') {
          this.schedulePoll();
        } else if (exam.status === 'READY' && !this.isAdmin()) {
          this.loadSubmission();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Could not load this exam.');
      }
    });
  }

  private loadSubmission(): void {
    this.isSubmissionLoading.set(true);
    this.examService.getSubmission(this.examId).subscribe({
      next: (submission) => {
        this.submission.set(submission);
        this.isSubmissionLoading.set(false);
      },
      error: () => {
        // No submission yet (404) — the student can still take the exam.
        this.isSubmissionLoading.set(false);
      }
    });
  }

  private schedulePoll(): void {
    timer(POLL_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadExam());
  }
}
