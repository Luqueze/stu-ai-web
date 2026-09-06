import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse, ExamSubmissionResponse } from '../../../core/exam/exam.models';
import { ExamDetailComponent } from './exam-detail.component';

describe('ExamDetailComponent', () => {
  let fixture: ComponentFixture<ExamDetailComponent>;
  let examServiceSpy: jasmine.SpyObj<ExamService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const pendingExam: ExamResponse = {
    id: 'exam-1',
    theme: 'Algebra',
    questionCount: 1,
    difficulty: 'EASY',
    status: 'PENDING',
    failureReason: null,
    failureMessage: null,
    durationMinutes: 10,
    createdAt: new Date().toISOString(),
    questions: null
  };

  const readyExam: ExamResponse = {
    ...pendingExam,
    status: 'READY',
    questions: [{ statement: '2 + 2 = ?', options: ['3', '4'], correctOptionIndex: null }]
  };

  const submission: ExamSubmissionResponse = {
    examId: 'exam-1',
    totalQuestions: 1,
    correctCount: 1,
    scorePercentage: 100,
    submittedAt: new Date().toISOString()
  };

  function setup(role: 'ADMIN' | 'STUDENT'): void {
    examServiceSpy = jasmine.createSpyObj<ExamService>('ExamService', ['getExam', 'getSubmission']);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    Object.defineProperty(authServiceSpy, 'currentUser', { value: () => ({ role }) });

    TestBed.configureTestingModule({
      imports: [ExamDetailComponent],
      providers: [
        { provide: ExamService, useValue: examServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'exam-1']]) } }
        }
      ]
    });

    fixture = TestBed.createComponent(ExamDetailComponent);
  }

  it('loads the exam once and does not poll when already READY', fakeAsync(() => {
    setup('ADMIN');
    examServiceSpy.getExam.and.returnValue(of(readyExam));

    fixture.detectChanges();
    tick(10000);

    expect(examServiceSpy.getExam).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.exam()).toEqual(readyExam);
  }));

  it('polls again after 3 seconds while the exam is PENDING, then stops once READY', fakeAsync(() => {
    setup('ADMIN');
    examServiceSpy.getExam.and.returnValues(of(pendingExam), of(readyExam));

    fixture.detectChanges();
    expect(examServiceSpy.getExam).toHaveBeenCalledTimes(1);

    tick(3000);
    expect(examServiceSpy.getExam).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.exam()?.status).toBe('READY');

    tick(10000);
    expect(examServiceSpy.getExam).toHaveBeenCalledTimes(2);
  }));

  it('does not fetch a submission for an admin viewing a READY exam', () => {
    setup('ADMIN');
    examServiceSpy.getExam.and.returnValue(of(readyExam));

    fixture.detectChanges();

    expect(examServiceSpy.getSubmission).not.toHaveBeenCalled();
  });

  it('shows the student result once a submission exists', () => {
    setup('STUDENT');
    examServiceSpy.getExam.and.returnValue(of(readyExam));
    examServiceSpy.getSubmission.and.returnValue(of(submission));

    fixture.detectChanges();

    expect(examServiceSpy.getSubmission).toHaveBeenCalledWith('exam-1');
    expect(fixture.componentInstance.submission()).toEqual(submission);
  });

  it('leaves submission unset when the student has not submitted yet (404)', () => {
    setup('STUDENT');
    examServiceSpy.getExam.and.returnValue(of(readyExam));
    examServiceSpy.getSubmission.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    fixture.detectChanges();

    expect(fixture.componentInstance.submission()).toBeNull();
    expect(fixture.componentInstance.isSubmissionLoading()).toBeFalse();
  });
});
