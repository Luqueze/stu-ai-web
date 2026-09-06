import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse } from '../../../core/exam/exam.models';
import { ExamListComponent } from './exam-list.component';

describe('ExamListComponent', () => {
  let fixture: ComponentFixture<ExamListComponent>;
  let component: ExamListComponent;
  let examServiceSpy: jasmine.SpyObj<ExamService>;

  const exams: ExamResponse[] = [
    {
      id: 'exam-1',
      theme: 'Algebra',
      questionCount: 10,
      difficulty: 'MEDIUM',
      status: 'READY',
      failureReason: null,
      failureMessage: null,
      durationMinutes: 30,
      createdAt: new Date().toISOString(),
      questions: []
    }
  ];

  function setup(): void {
    examServiceSpy = jasmine.createSpyObj<ExamService>('ExamService', ['listExams']);

    TestBed.configureTestingModule({
      imports: [ExamListComponent],
      providers: [provideRouter([]), { provide: ExamService, useValue: examServiceSpy }]
    });

    fixture = TestBed.createComponent(ExamListComponent);
    component = fixture.componentInstance;
  }

  it('loads and displays exams on init', () => {
    setup();
    examServiceSpy.listExams.and.returnValue(of(exams));

    fixture.detectChanges();

    expect(component.exams()).toEqual(exams);
    expect(component.isLoading()).toBeFalse();
  });

  it('sets an error message when loading exams fails', () => {
    setup();
    examServiceSpy.listExams.and.returnValue(throwError(() => new Error('network error')));

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Could not load exams. Please try again later.');
  });
});
