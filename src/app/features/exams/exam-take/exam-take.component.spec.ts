import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse, ExamSessionResponse, ExamSubmissionResponse } from '../../../core/exam/exam.models';
import { ExamTakeComponent } from './exam-take.component';

describe('ExamTakeComponent', () => {
  let fixture: ComponentFixture<ExamTakeComponent>;
  let component: ExamTakeComponent;
  let examServiceSpy: jasmine.SpyObj<ExamService>;
  let router: Router;

  const readyExam: ExamResponse = {
    id: 'exam-1',
    theme: 'Algebra',
    questionCount: 2,
    difficulty: 'EASY',
    status: 'READY',
    failureReason: null,
    failureMessage: null,
    durationMinutes: 10,
    createdAt: new Date().toISOString(),
    questions: [
      { statement: '2 + 2 = ?', options: ['3', '4'], correctOptionIndex: null },
      { statement: '3 + 3 = ?', options: ['5', '6'], correctOptionIndex: null }
    ]
  };

  const session: ExamSessionResponse = {
    examId: 'exam-1',
    startedAt: new Date().toISOString(),
    remainingSeconds: 5
  };

  const submissionResult: ExamSubmissionResponse = {
    examId: 'exam-1',
    totalQuestions: 2,
    correctCount: 2,
    scorePercentage: 100,
    submittedAt: new Date().toISOString()
  };

  function setup(): void {
    examServiceSpy = jasmine.createSpyObj<ExamService>('ExamService', [
      'getExam',
      'startSession',
      'submitExam'
    ]);

    TestBed.configureTestingModule({
      imports: [ExamTakeComponent],
      providers: [
        provideRouter([]),
        { provide: ExamService, useValue: examServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'exam-1']]) } }
        }
      ]
    });

    fixture = TestBed.createComponent(ExamTakeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  it('loads the exam, starts a session and seeds one answer slot per question', () => {
    setup();
    examServiceSpy.getExam.and.returnValue(of(readyExam));
    examServiceSpy.startSession.and.returnValue(of(session));

    fixture.detectChanges();

    expect(examServiceSpy.startSession).toHaveBeenCalledWith('exam-1');
    expect(component.answers()).toEqual([null, null]);
    expect(component.remainingSeconds()).toBe(5);
    expect(component.isLoading()).toBeFalse();
  });

  it('tracks selected answers and only allows submit once every question is answered', () => {
    setup();
    examServiceSpy.getExam.and.returnValue(of(readyExam));
    examServiceSpy.startSession.and.returnValue(of(session));
    fixture.detectChanges();

    expect(component.allAnswered()).toBeFalse();

    component.selectOption(0, 1);
    expect(component.answers()).toEqual([1, null]);
    expect(component.allAnswered()).toBeFalse();

    component.selectOption(1, 0);
    expect(component.answers()).toEqual([1, 0]);
    expect(component.allAnswered()).toBeTrue();
  });

  it('submits the selected answers and navigates to the exam detail page', () => {
    setup();
    examServiceSpy.getExam.and.returnValue(of(readyExam));
    examServiceSpy.startSession.and.returnValue(of(session));
    examServiceSpy.submitExam.and.returnValue(of(submissionResult));
    fixture.detectChanges();

    component.selectOption(0, 1);
    component.selectOption(1, 0);
    component.onSubmit();

    expect(examServiceSpy.submitExam).toHaveBeenCalledWith('exam-1', { selectedOptions: [1, 0] });
    expect(router.navigate).toHaveBeenCalledWith(['/exams', 'exam-1']);
  });

  it('auto-submits with -1 for unanswered questions once the timer reaches zero', fakeAsync(() => {
    setup();
    examServiceSpy.getExam.and.returnValue(of(readyExam));
    examServiceSpy.startSession.and.returnValue(of({ ...session, remainingSeconds: 2 }));
    examServiceSpy.submitExam.and.returnValue(of(submissionResult));
    fixture.detectChanges();

    component.selectOption(0, 1);
    tick(2000);

    expect(examServiceSpy.submitExam).toHaveBeenCalledWith('exam-1', { selectedOptions: [1, -1] });
  }));

  it('redirects to the exam detail page if the exam was already submitted', () => {
    setup();
    examServiceSpy.getExam.and.returnValue(of(readyExam));
    examServiceSpy.startSession.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Exam exam-1 has already been submitted by this student' }
          })
      )
    );

    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/exams', 'exam-1']);
  });
});
