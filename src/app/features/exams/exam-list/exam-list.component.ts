import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse } from '../../../core/exam/exam.models';

const PASS_THRESHOLD = 60;
const PAGE_SIZE = 6;

export type ExamOutcome = 'PENDING' | 'ERROR' | 'READY' | 'PASSED' | 'FAILED';
export type ExamFilter = 'All' | 'Ready' | 'Passed' | 'Failed';

export interface ExamRow {
  exam: ExamResponse;
  outcome: ExamOutcome;
  scorePercentage: number | null;
}

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './exam-list.component.html',
  styleUrl: './exam-list.component.scss'
})
export class ExamListComponent implements OnInit {
  private readonly examService = inject(ExamService);
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly rows = signal<ExamRow[]>([]);
  readonly filter = signal<ExamFilter>('All');
  readonly query = signal('');
  readonly visibleCount = signal(PAGE_SIZE);

  readonly filters: readonly ExamFilter[] = ['All', 'Ready', 'Passed', 'Failed'];

  readonly counts = computed(() => {
    const rows = this.rows();
    return {
      All: rows.length,
      Ready: rows.filter((row) => row.outcome === 'READY').length,
      Passed: rows.filter((row) => row.outcome === 'PASSED').length,
      Failed: rows.filter((row) => row.outcome === 'FAILED').length
    };
  });

  readonly stats = computed(() => {
    const rows = this.rows();
    const scored = rows.filter((row) => row.scorePercentage !== null);
    const passed = rows.filter((row) => row.outcome === 'PASSED').length;
    const completed = scored.length;
    const average = completed
      ? Math.round(scored.reduce((sum, row) => sum + (row.scorePercentage ?? 0), 0) / completed)
      : 0;
    return {
      total: rows.length,
      completed,
      average,
      passed,
      readyCount: this.counts().Ready,
      pendingCount: rows.filter((row) => row.outcome === 'PENDING').length
    };
  });

  readonly heroSubtitle = computed(() => {
    const stats = this.stats();
    if (stats.readyCount > 0) {
      return `You have ${stats.readyCount} exam${stats.readyCount === 1 ? '' : 's'} ready to take.`;
    }
    if (stats.pendingCount > 0) {
      return `${stats.pendingCount} exam${stats.pendingCount === 1 ? '' : 's'} still generating.`;
    }
    return null;
  });

  readonly filteredRows = computed(() => {
    const filter = this.filter();
    const q = this.query().trim().toLowerCase();
    return this.rows().filter((row) => {
      if (filter !== 'All' && row.outcome !== filter.toUpperCase()) {
        return false;
      }
      return !q || row.exam.theme.toLowerCase().includes(q);
    });
  });

  readonly visibleRows = computed(() => this.filteredRows().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.filteredRows().length > this.visibleCount());

  ngOnInit(): void {
    this.examService.listExams().subscribe({
      next: (exams) => this.loadOutcomes(exams),
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Could not load exams. Please try again later.');
      }
    });
  }

  onFilterChange(filter: ExamFilter): void {
    this.filter.set(filter);
    this.visibleCount.set(PAGE_SIZE);
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.visibleCount.set(PAGE_SIZE);
  }

  loadMore(): void {
    this.visibleCount.update((count) => count + PAGE_SIZE);
  }

  statusLabel(outcome: ExamOutcome): string {
    switch (outcome) {
      case 'PENDING':
        return 'Generating';
      case 'ERROR':
        return 'Error';
      case 'READY':
        return 'Ready';
      case 'PASSED':
        return 'Passed';
      case 'FAILED':
        return 'Failed';
    }
  }

  actionLabel(outcome: ExamOutcome): string {
    switch (outcome) {
      case 'READY':
        return 'Start';
      case 'FAILED':
        return 'Retake';
      case 'PASSED':
        return 'Review';
      default:
        return 'View';
    }
  }

  actionLink(row: ExamRow): string[] {
    if (row.outcome === 'READY' || row.outcome === 'FAILED') {
      return ['/exams', row.exam.id, 'take'];
    }
    return ['/exams', row.exam.id];
  }

  private loadOutcomes(exams: ExamResponse[]): void {
    if (exams.length === 0) {
      this.rows.set([]);
      this.isLoading.set(false);
      return;
    }

    const requests = exams.map((exam) => {
      if (exam.status === 'PENDING') {
        return of<ExamRow>({ exam, outcome: 'PENDING', scorePercentage: null });
      }
      if (exam.status === 'FAILED') {
        return of<ExamRow>({ exam, outcome: 'ERROR', scorePercentage: null });
      }
      return this.examService.getSubmission(exam.id).pipe(
        map(
          (submission): ExamRow => ({
            exam,
            outcome: submission.scorePercentage >= PASS_THRESHOLD ? 'PASSED' : 'FAILED',
            scorePercentage: submission.scorePercentage
          })
        ),
        catchError(() => of<ExamRow>({ exam, outcome: 'READY', scorePercentage: null }))
      );
    });

    forkJoin(requests).subscribe((rows) => {
      this.rows.set(rows);
      this.isLoading.set(false);
    });
  }
}
