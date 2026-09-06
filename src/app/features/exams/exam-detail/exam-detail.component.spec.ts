import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse } from '../../../core/exam/exam.models';
import { ExamDetailComponent } from './exam-detail.component';

describe('ExamDetailComponent', () => {
  let fixture: ComponentFixture<ExamDetailComponent>;
  let examServiceSpy: jasmine.SpyObj<ExamService>;

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
    questions: [{ statement: '2 + 2 = ?', options: ['3', '4'], correctOptionIndex: 1 }]
  };

  function setup(): void {
    examServiceSpy = jasmine.createSpyObj<ExamService>('ExamService', ['getExam']);

    TestBed.configureTestingModule({
      imports: [ExamDetailComponent],
      providers: [
        { provide: ExamService, useValue: examServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'exam-1']]) } }
        }
      ]
    });

    fixture = TestBed.createComponent(ExamDetailComponent);
  }

  it('loads the exam once and does not poll when already READY', fakeAsync(() => {
    setup();
    examServiceSpy.getExam.and.returnValue(of(readyExam));

    fixture.detectChanges();
    tick(10000);

    expect(examServiceSpy.getExam).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.exam()).toEqual(readyExam);
  }));

  it('polls again after 3 seconds while the exam is PENDING, then stops once READY', fakeAsync(() => {
    setup();
    examServiceSpy.getExam.and.returnValues(of(pendingExam), of(readyExam));

    fixture.detectChanges();
    expect(examServiceSpy.getExam).toHaveBeenCalledTimes(1);

    tick(3000);
    expect(examServiceSpy.getExam).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.exam()?.status).toBe('READY');

    tick(10000);
    expect(examServiceSpy.getExam).toHaveBeenCalledTimes(2);
  }));
});
