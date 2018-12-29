import { AppConfigService } from './app-config.service';
// import { API_URL, API_CMS_MANAGEMENT_URL } from './../constants/app.constants';
import { HttpResponseBody } from './../objects/response/HttpResponseBody';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Drug } from '../objects/Drug';
import { DrugItem } from '../objects/DrugItem';

@Injectable()
export class DrugService {
  drugItems: DrugItem[];
  headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private API_URL;
  private API_CMS_MANAGEMENT_URL;

  constructor(private http: HttpClient, private appConfig: AppConfigService) {
    this.API_URL = appConfig.getConfig().API_URL;
    this.API_CMS_MANAGEMENT_URL = appConfig.getConfig().API_CMS_MANAGEMENT_URL;
  }

  add(drug: Drug) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.API_URL}/cms/drug/add/`, JSON.stringify(drug), { headers });
  }

  listDrugs(pageNum, pageSize) {
    const list = this.http.post<HttpResponseBody>(
      `${this.API_CMS_MANAGEMENT_URL}/drug/list/${pageNum}/${pageSize}`,
      {},
      { headers: this.headers }
    );

    return list;
  }

  removeDrug(drugId) {
    return this.http.post<HttpResponseBody>(
      `${this.API_URL}/cms/drug/remove1111/${drugId}`,

      JSON.stringify({}),
      { observe: 'response' }
    );
  }
}
