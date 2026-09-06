import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiKeyResponse, SaveApiKeyRequest } from './profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/users/me/api-keys`;

  listApiKeys(): Observable<ApiKeyResponse[]> {
    return this.http.get<ApiKeyResponse[]>(this.baseUrl);
  }

  saveApiKey(request: SaveApiKeyRequest): Observable<ApiKeyResponse> {
    return this.http.post<ApiKeyResponse>(this.baseUrl, request);
  }
}
