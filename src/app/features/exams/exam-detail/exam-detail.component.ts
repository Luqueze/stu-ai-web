import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { timer } from 'rxjs';

import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse } from '../../../core/exam/exam.models';

const POLL_INTERVAL_MS = 3000;

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './exam-detail.component.html',
  styleUrl: './exam-detail.component.scss'
})
export class ExamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly examService = inject(ExamService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly examId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly exam = signal<ExamResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

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
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Could not load this exam.');
      }
    });
  }

  private schedulePoll(): void {
    timer(POLL_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadExam());
  }
}
