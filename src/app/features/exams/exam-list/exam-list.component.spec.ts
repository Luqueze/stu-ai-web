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

  function setup(currentUser: { role: string; name?: string } | null): void {
    examServiceSpy = jasmine.createSpyObj<ExamService>('ExamService', ['listExams']);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    Object.defineProperty(authServiceSpy, 'currentUser', { value: () => currentUser });

    TestBed.configureTestingModule({
      imports: [ExamListComponent],
      providers: [
        provideRouter([]),
        { provide: ExamService, useValue: examServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
  }

  it('loads and displays exams on init', () => {
    setup({ role: 'STUDENT' });
    examServiceSpy.listExams.and.returnValue(of(exams));

    fixture = TestBed.createComponent(ExamListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.exams()).toEqual(exams);
    expect(component.isLoading()).toBeFalse();
    expect(component.isAdmin()).toBeFalse();
  });

  it('sets an error message when loading exams fails', () => {
    setup({ role: 'STUDENT' });
    examServiceSpy.listExams.and.returnValue(throwError(() => new Error('network error')));

    fixture = TestBed.createComponent(ExamListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Could not load exams. Please try again later.');
  });

  it('exposes isAdmin as true for an ADMIN user', () => {
    setup({ role: 'ADMIN' });
    examServiceSpy.listExams.and.returnValue(of([]));

    fixture = TestBed.createComponent(ExamListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isAdmin()).toBeTrue();
  });
});
