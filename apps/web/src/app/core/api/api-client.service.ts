import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  isApiUrl(url: string): boolean {
    return url.startsWith(this.apiBaseUrl);
  }
}
