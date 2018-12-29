import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponseBody } from '../objects/response/HttpResponseBody';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AppConfigService } from './app-config.service';
import { Case } from '../objects/Case';
import { Page } from '../model/page';

@Injectable()
export class ApiCaseManagerService {

  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private API_CASE_INFO_URL;

  constructor(private http: HttpClient, private appConfig: AppConfigService) {
    this.API_CASE_INFO_URL = appConfig.getConfig().API_CASE_INFO_URL;
  }

  create(createCase: Case): Observable<HttpResponseBody> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<HttpResponseBody>(`${this.API_CASE_INFO_URL}/case/create`, JSON.stringify(createCase), {
      headers: headers
    });
  }

  getCaseList(clinicID: string, caseBody, page: Page): Observable<HttpResponseBody> {
    return this.http.post<HttpResponseBody>(
      `${this.API_CASE_INFO_URL}/list/all/${clinicID}/${page.pageNumber}/${page.size}`, JSON.stringify(caseBody), {
        headers: this.headers
      }
    );
  }

  update(id: string, cases: Case): Observable<HttpResponseBody> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<HttpResponseBody>(`${this.API_CASE_INFO_URL}/update/${id}`, JSON.stringify(cases), {
      headers: headers
    });
    return null;
  }

  searchCase(caseId: string): Observable<HttpResponseBody> {
    return this.http.post<HttpResponseBody>(
      `${this.API_CASE_INFO_URL}/search/${caseId}`, JSON.stringify({}), {
        headers: this.headers
      }
    );
  }

  closeCase(caseId: string): Observable<HttpResponseBody> {
    return this.http.post<HttpResponseBody>(
      `${this.API_CASE_INFO_URL}/close/${caseId}`, JSON.stringify({}), {
        headers: this.headers
      }
    );
  }

  getPaymentTypes(caseId: string): Observable<HttpResponseBody> {
    return this.http.post<HttpResponseBody>(
      `${this.API_CASE_INFO_URL}/paymentTypes/${caseId}`, JSON.stringify({}), {
        headers: this.headers
      }
    );
  }

  recordNewPayment(caseId: string, payment: any): Observable<HttpResponseBody> {
    return this.http.post<HttpResponseBody>(
      `${this.API_CASE_INFO_URL}/newPayment/${caseId}`, JSON.stringify(payment), {
        headers: this.headers
      }
    );
  }

  deletePayment(caseId: string, payment: any): Observable<HttpResponseBody> {
    return this.http.post<HttpResponseBody>(
      `${this.API_CASE_INFO_URL}/deletePayment/${caseId}`, JSON.stringify({}), {
        headers: this.headers
      }
    );
  }
}
