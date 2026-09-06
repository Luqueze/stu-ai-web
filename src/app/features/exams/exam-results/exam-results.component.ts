import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ExamService } from '../../../core/exam/exam.service';
import { ExamSubmissionSummaryResponse } from '../../../core/exam/exam.models';

@Component({
  selector: 'app-exam-results',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './exam-results.component.html',
  styleUrl: './exam-results.component.scss'
})
export class ExamResultsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly examService = inject(ExamService);

  readonly examId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly submissions = signal<ExamSubmissionSummaryResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.examService.listSubmissions(this.examId).subscribe({
      next: (submissions) => {
        this.submissions.set(submissions);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Could not load results for this exam.');
      }
    });
  }
}
