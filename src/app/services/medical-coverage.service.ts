import { AppConfigService } from './app-config.service';
// import { API_URL } from './../constants/app.constants';
import { Observable } from 'rxjs';
import { MedicalCoverageAdd } from './../objects/MedicalCoverageAdd';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { HttpResponseBody } from '../objects/response/HttpResponseBody';

@Injectable()
export class MedicalCoverageService {
  private API_URL;
  constructor(private http: HttpClient, private appConfig: AppConfigService) {
    this.API_URL = appConfig.getConfig().API_URL;
  }

  addCoverage(medicalCoverage: MedicalCoverageAdd): Observable<HttpResponseBody> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<HttpResponseBody>(
      `${this.API_URL}/cms-management-proxy111/cms/coverage/add`,
      JSON.stringify(medicalCoverage),
      { headers: headers }
    );
  }

  listCoverage(pageNum: number, pageSize: number): Observable<HttpResponseBody> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log('pageNum: ', pageNum);
    console.log('pageSize: ', pageSize);
    return this.http.post<HttpResponseBody>(
      `${this.API_URL}/cms-management-proxy/coverage/list/${pageNum}/${pageSize}/false`,
      JSON.stringify({}),
      { headers: headers }
    );
  }
}
