import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly apiBaseUrl = '/api';

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }
}
