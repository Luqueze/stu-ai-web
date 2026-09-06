import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ExamService } from './exam.service';
import { ExamResponse } from './exam.models';

describe('ExamService', () => {
  let service: ExamService;
  let httpMock: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ExamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listExams() GETs the exams collection', () => {
    service.listExams().subscribe((exams) => expect(exams).toEqual([exam]));

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/exams`);
    expect(req.request.method).toBe('GET');
    req.flush([exam]);
  });

  it('getExam() GETs a single exam by id', () => {
    service.getExam('exam-1').subscribe((result) => expect(result).toEqual(exam));

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/exams/exam-1`);
    expect(req.request.method).toBe('GET');
    req.flush(exam);
  });

  it('createExam() POSTs a new exam request', () => {
    const request = { theme: 'Algebra', questionCount: 10, difficulty: 'MEDIUM' as const, durationMinutes: 30 };
    service.createExam(request).subscribe((result) => expect(result).toEqual(exam));

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/exams`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(exam, { status: 202, statusText: 'Accepted' });
  });
});
