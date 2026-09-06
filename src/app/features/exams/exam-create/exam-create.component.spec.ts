import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ExamService } from '../../../core/exam/exam.service';
import { ExamResponse } from '../../../core/exam/exam.models';
import { ExamCreateComponent } from './exam-create.component';

describe('ExamCreateComponent', () => {
  let fixture: ComponentFixture<ExamCreateComponent>;
  let component: ExamCreateComponent;
  let examServiceSpy: jasmine.SpyObj<ExamService>;
  let router: Router;

  const exam: ExamResponse = {
    id: 'exam-1',
    theme: 'Algebra',
    questionCount: 10,
    difficulty: 'MEDIUM',
    status: 'PENDING',
    failureReason: null,
    failureMessage: null,
    durationMinutes: 30,
    createdAt: new Date().toISOString(),
    questions: null
  };

  beforeEach(async () => {
    examServiceSpy = jasmine.createSpyObj<ExamService>('ExamService', ['createExam']);

    await TestBed.configureTestingModule({
      imports: [ExamCreateComponent],
      providers: [provideRouter([]), { provide: ExamService, useValue: examServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ExamCreateComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('does not call createExam() when the form is invalid', () => {
    component.form.patchValue({ theme: '' });

    component.onSubmit();

    expect(examServiceSpy.createExam).not.toHaveBeenCalled();
  });

  it('calls createExam() and navigates to the exam detail page on success', () => {
    examServiceSpy.createExam.and.returnValue(of(exam));
    component.form.setValue({
      theme: 'Algebra',
      questionCount: 10,
      difficulty: 'MEDIUM',
      durationMinutes: 30
    });

    component.onSubmit();

    expect(examServiceSpy.createExam).toHaveBeenCalledWith({
      theme: 'Algebra',
      questionCount: 10,
      difficulty: 'MEDIUM',
      durationMinutes: 30
    });
    expect(router.navigate).toHaveBeenCalledWith(['/exams', 'exam-1']);
  });

  it('sets an error message when createExam() fails with 403', () => {
    examServiceSpy.createExam.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'Forbidden' } }))
    );
    component.form.setValue({
      theme: 'Algebra',
      questionCount: 10,
      difficulty: 'MEDIUM',
      durationMinutes: 30
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe("You don't have permission to create exams.");
  });
});
