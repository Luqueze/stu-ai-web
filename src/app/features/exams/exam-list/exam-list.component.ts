import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse } from '../../../core/exam/exam.models';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './exam-list.component.html',
  styleUrl: './exam-list.component.scss'
})
export class ExamListComponent implements OnInit {
  private readonly examService = inject(ExamService);
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly exams = signal<ExamResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly pendingCount = computed(() => this.exams().filter((e) => e.status === 'PENDING').length);

  ngOnInit(): void {
    this.examService.listExams().subscribe({
      next: (exams) => {
        this.exams.set(exams);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Could not load exams. Please try again later.');
      }
    });
  }
}
