export interface ApiKeyResponse {
  id: string;
  provider: string;
  createdAt: string;
}

export interface SaveApiKeyRequest {
  provider: string;
  apiKey: string;
}
