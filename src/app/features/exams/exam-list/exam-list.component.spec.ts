import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse } from '../../../core/exam/exam.models';
import { ExamListComponent } from './exam-list.component';

describe('ExamListComponent', () => {
  let fixture: ComponentFixture<ExamListComponent>;
  let component: ExamListComponent;
  let examServiceSpy: jasmine.SpyObj<ExamService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

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
