import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ExamService } from '../../../core/exam/exam.service';
import { ExamSubmissionSummaryResponse } from '../../../core/exam/exam.models';
import { ExamResultsComponent } from './exam-results.component';

describe('ExamResultsComponent', () => {
  let fixture: ComponentFixture<ExamResultsComponent>;
  let component: ExamResultsComponent;
  let examServiceSpy: jasmine.SpyObj<ExamService>;

  const submissions: ExamSubmissionSummaryResponse[] = [
    {
      studentEmail: 'student@example.com',
      totalQuestions: 10,
      correctCount: 8,
      scorePercentage: 80,
      submittedAt: new Date().toISOString()
    }
  ];

  function setup(): void {
    examServiceSpy = jasmine.createSpyObj<ExamService>('ExamService', ['listSubmissions']);

    TestBed.configureTestingModule({
      imports: [ExamResultsComponent],
      providers: [
        provideRouter([]),
        { provide: ExamService, useValue: examServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'exam-1']]) } }
        }
      ]
    });

    fixture = TestBed.createComponent(ExamResultsComponent);
    component = fixture.componentInstance;
  }

  it('loads and displays submissions for the exam', () => {
    setup();
    examServiceSpy.listSubmissions.and.returnValue(of(submissions));

    fixture.detectChanges();

    expect(examServiceSpy.listSubmissions).toHaveBeenCalledWith('exam-1');
    expect(component.submissions()).toEqual(submissions);
    expect(component.isLoading()).toBeFalse();
  });

  it('sets an error message when loading results fails', () => {
    setup();
    examServiceSpy.listSubmissions.and.returnValue(throwError(() => new Error('network error')));

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Could not load results for this exam.');
    expect(component.isLoading()).toBeFalse();
  });
});
