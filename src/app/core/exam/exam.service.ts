import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateExamRequest,
  ExamResponse,
  ExamSessionResponse,
  ExamSubmissionResponse,
  ExamSubmissionSummaryResponse,
  SubmitExamRequest
} from './exam.models';

@Injectable({ providedIn: 'root' })
export class ExamService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/exams`;

  listExams(): Observable<ExamResponse[]> {
    return this.http.get<ExamResponse[]>(this.baseUrl);
  }

  getExam(id: string): Observable<ExamResponse> {
    return this.http.get<ExamResponse>(`${this.baseUrl}/${id}`);
  }

  createExam(request: CreateExamRequest): Observable<ExamResponse> {
    return this.http.post<ExamResponse>(this.baseUrl, request);
  }

  startSession(examId: string): Observable<ExamSessionResponse> {
    return this.http.post<ExamSessionResponse>(`${this.baseUrl}/${examId}/session`, {});
  }

  getSession(examId: string): Observable<ExamSessionResponse> {
    return this.http.get<ExamSessionResponse>(`${this.baseUrl}/${examId}/session`);
  }

  submitExam(examId: string, request: SubmitExamRequest): Observable<ExamSubmissionResponse> {
    return this.http.post<ExamSubmissionResponse>(`${this.baseUrl}/${examId}/submission`, request);
  }

  getSubmission(examId: string): Observable<ExamSubmissionResponse> {
    return this.http.get<ExamSubmissionResponse>(`${this.baseUrl}/${examId}/submission`);
  }

  listSubmissions(examId: string): Observable<ExamSubmissionSummaryResponse[]> {
    return this.http.get<ExamSubmissionSummaryResponse[]>(`${this.baseUrl}/${examId}/submissions`);
  }
}
