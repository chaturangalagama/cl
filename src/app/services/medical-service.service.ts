import { AppConfigService } from './app-config.service';
import { HttpHeaders, HttpClient } from '@angular/common/http';
// import { API_CMS_MANAGEMENT_URL } from './../constants/app.constants';
import { HttpResponseBody } from './../objects/response/HttpResponseBody';
import { Injectable } from '@angular/core';

@Injectable()
export class MedicalServiceService {
  headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private API_CMS_MANAGEMENT_URL;
  constructor(private http: HttpClient, private appConfig: AppConfigService) {
    this.API_CMS_MANAGEMENT_URL = appConfig.getConfig().API_CMS_MANAGEMENT_URL;
  }

  listMedicalServices() {
    const list = this.http.post<HttpResponseBody>(
      `${this.API_CMS_MANAGEMENT_URL}/medical-service/list/all`,
      {},
      { headers: this.headers }
    );

    return list;
  }
}
