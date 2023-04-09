import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private httpClient: HttpClient) {}

  API_URL = 'http://185.146.3.164';

  public getEvents() {
    return this.httpClient.get<any>(`${this.API_URL}/api/device_event`);
  }
  public patchEvent(id: any) {
    return this.httpClient.patch<any>(
      `${this.API_URL}/api/device_event/${id}`,
      {
        showPopup: false,
      }
    );
  }
}
