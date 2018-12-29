// import { API_PATIENT_INFO_URL } from './../constants/app.constants';
import { HttpResponseBody } from './../objects/response/HttpResponseBody';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class PolicyHolderService {
  constructor(private http: HttpClient) {}

  // assignPolicy(coverageType, body) {
  //     console.log('assignPolicy() body', body);
  //     const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //     console.log('body:::::', body);
  //     return this.http.post<HttpResponseBody>(
  //         `${API_PATIENT_INFO_URL}/policyholder/add/${coverageType}`,
  //         JSON.stringify(body),
  //         { observe: 'response', headers: headers }
  //     );
  // }

  // searchByUserId(body) {
  //     const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //     return this.http.post<HttpResponseBody>(
  //         `${API_PATIENT_INFO_URL}/policyholder/search-by-user-id`,
  //         JSON.stringify(body),
  //         { observe: 'response', headers: headers }
  //     );

  // }
}
