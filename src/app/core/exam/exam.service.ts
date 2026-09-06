import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateExamRequest, ExamResponse } from './exam.models';

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
}
