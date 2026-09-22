import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse, ExamSubmissionResponse } from '../../../core/exam/exam.models';
import { ExamListComponent } from './exam-list.component';

describe('ExamListComponent', () => {
  let fixture: ComponentFixture<ExamListComponent>;
  let component: ExamListComponent;
  let examServiceSpy: jasmine.SpyObj<ExamService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  function makeExam(overrides: Partial<ExamResponse>): ExamResponse {
    return {
      id: 'exam-1',
      theme: 'Algebra',
      questionCount: 10,
      difficulty: 'MEDIUM',
      status: 'READY',
      failureReason: null,
      failureMessage: null,
      durationMinutes: 30,
      createdAt: new Date().toISOString(),
      questions: [],
      ...overrides
    };
  }

  function makeSubmission(overrides: Partial<ExamSubmissionResponse>): ExamSubmissionResponse {
    return {
      examId: 'exam-1',
      totalQuestions: 10,
      correctCount: 8,
      scorePercentage: 80,
      submittedAt: new Date().toISOString(),
      flaggedQuestions: [],
      ...overrides
    };
  }

  function setup(): void {
    examServiceSpy = jasmine.createSpyObj<ExamService>('ExamService', ['listExams', 'getSubmission']);
    authServiceSpy = {
      currentUser: () => ({ id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'STUDENT' })
    } as unknown as jasmine.SpyObj<AuthService>;

    TestBed.configureTestingModule({
      imports: [ExamListComponent],
      providers: [
        provideRouter([]),
        { provide: ExamService, useValue: examServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(ExamListComponent);
    component = fixture.componentInstance;
  }

  it('loads exams and classifies an unsubmitted ready exam', () => {
    setup();
    examServiceSpy.listExams.and.returnValue(of([makeExam({ status: 'READY' })]));
    examServiceSpy.getSubmission.and.returnValue(throwError(() => new Error('404')));

    fixture.detectChanges();

    expect(component.isLoading()).toBeFalse();
    expect(component.rows()).toEqual([{ exam: jasmine.any(Object), outcome: 'READY', scorePercentage: null }]);
    expect(component.stats().total).toBe(1);
    expect(component.stats().readyCount).toBe(1);
  });

  it('classifies a submitted exam as passed or failed based on score', () => {
    setup();
    examServiceSpy.listExams.and.returnValue(of([makeExam({ status: 'READY' })]));
    examServiceSpy.getSubmission.and.returnValue(of(makeSubmission({ scorePercentage: 42 })));

    fixture.detectChanges();

    expect(component.rows()[0].outcome).toBe('FAILED');
    expect(component.rows()[0].scorePercentage).toBe(42);
    expect(component.stats().completed).toBe(1);
    expect(component.stats().passed).toBe(0);
  });

  it('classifies pending and generation-failed exams without calling getSubmission', () => {
    setup();
    examServiceSpy.listExams.and.returnValue(
      of([makeExam({ id: 'exam-2', status: 'PENDING' }), makeExam({ id: 'exam-3', status: 'FAILED' })])
    );

    fixture.detectChanges();

    expect(examServiceSpy.getSubmission).not.toHaveBeenCalled();
    expect(component.rows().map((row) => row.outcome)).toEqual(['PENDING', 'ERROR']);
  });

  it('filters rows by search query', () => {
    setup();
    examServiceSpy.listExams.and.returnValue(
      of([makeExam({ id: 'exam-1', theme: 'Algebra', status: 'PENDING' }), makeExam({ id: 'exam-2', theme: 'World war 1', status: 'PENDING' })])
    );

    fixture.detectChanges();
    component.onQueryChange('war');

    expect(component.filteredRows().length).toBe(1);
    expect(component.filteredRows()[0].exam.theme).toBe('World war 1');
  });

  it('sets an error message when loading exams fails', () => {
    setup();
    examServiceSpy.listExams.and.returnValue(throwError(() => new Error('network error')));

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Could not load exams. Please try again later.');
  });
});
