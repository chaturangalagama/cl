import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';

import { AlertService } from '../../../../services/alert.service';
import { StoreService } from '../../../../services/store.service';
import { DISPLAY_DATE_FORMAT } from '../../../../constants/app.constants';
import { PatientVisitHistory } from '../../../../objects/request/PatientVisitHistory';
import { ApiPatientVisitService } from '../../../../services/api-patient-visit.service';
import { LoggerService } from '../../../../services/logger.service';
import {
  ConsultationHistoryItem,
  ConsultationHistoryPrescription
} from '../consultation-history-item/consultation-history-item.component';
import { DrugDispatch, DispatchDrugDetail } from '../../../../objects/request/DrugDispatch';

@Component({
  selector: 'app-consultation-history-main-container',
  templateUrl: './consultation-history-main-container.component.html',
  styleUrls: ['./consultation-history-main-container.component.scss']
})
export class ConsultationHistoryMainContainerComponent implements OnInit {
  @Output() copiedPrescription = new EventEmitter<DispatchDrugDetail[]>();

  histories: Array<PatientVisitHistory>;

  dateFrom: string;
  dateTo: string;
  dateRange;
  searchKey: string;

  constructor(
    private apiPatientVisitService: ApiPatientVisitService,
    private store: StoreService,
    private alertService: AlertService,
    private logger: LoggerService
  ) {
    this.histories = [];
  }

  ngOnInit() {
    this.getPatientConsultationHistory();

    const from = moment()
      .subtract(6, 'months')
      .format(DISPLAY_DATE_FORMAT)
      .toString();
    const to = moment()
      .format(DISPLAY_DATE_FORMAT)
      .toString();
    console.log('DATE', from, to);
    this.dateFrom = from;
    this.dateTo = to;
  }

  getPatientConsultationHistory() {
    this.apiPatientVisitService.getPatientVisitHistory(this.store.getPatientId(), 0, 50).subscribe(
      resp => {
        if (resp.payload) {
          // this.patientVisitHistory = resp.payload;
          resp.payload.map((value, index) => {
            console.log('Patient History Value', value);
            if (Object.keys(value).length > 0) {
              this.histories.push(<PatientVisitHistory>value);
            }
          });
          this.logger.info('MDATA_', this.histories);
        }
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );
  }

  generateData() {
    const tempPrescriptions = [
      new ConsultationHistoryPrescription('SPECTRABAN SC GEL SPF 40 45ML', '1 TUB'),
      new ConsultationHistoryPrescription('INFLUVAC SH 2017', '1 VIA')
    ];
    console.log('PREAC', tempPrescriptions);
    const tempData = new ConsultationHistoryItem(
      'Vaccine biol subs caus adv eff Rx use',
      '22/04/2018',
      tempPrescriptions,
      'CAME FOR LAST DOSE OF TWINRIX im twinrix given left u o arm  AHABB304BB',
      'MEYKKUMAR S/O MEYAPPAN/HJD'
    );

    return [tempData, tempData];
  }

  onSearch() {
    if (this.dateRange) {
      this.dateFrom = this.dateRange[0];
      this.dateTo = this.dateRange[1];
    }
    if (this.dateFrom && this.dateTo) {
      let newDateFrom, newDateTo;
      this.logger.info(
        'Date Params Pre',
        this.dateFrom,
        moment(this.dateFrom, DISPLAY_DATE_FORMAT).isValid(),
        this.dateTo
      );

      newDateFrom = moment(this.dateFrom, DISPLAY_DATE_FORMAT).format(DISPLAY_DATE_FORMAT);
      newDateTo = moment(this.dateTo, DISPLAY_DATE_FORMAT).format(DISPLAY_DATE_FORMAT);

      this.logger.info('Date Params', newDateFrom, newDateTo);

      if (this.searchKey) {
        this.apiPatientVisitService
          .getPatientVisitHistoryByDateAndFilter(this.store.getPatientId(), this.searchKey, newDateFrom, newDateTo)
          .subscribe(
            res => {
              if (res.payload) {
                this.histories = [];
                res.payload.map((value, index) => {
                  this.logger.info('Patient History Value', value);
                  if (Object.keys(value).length > 0) {
                    this.histories.push(<PatientVisitHistory>value);
                  }
                });
              }
            },
            err => {
              this.alertService.error(JSON.stringify(err.error.message));
            }
          );
      } else {
        this.apiPatientVisitService
          .getPatientVisitHistoryByDate(this.store.getPatientId(), newDateFrom, newDateTo)
          .subscribe(
            res => {
              if (res.payload) {
                this.histories = [];
                res.payload.map((value, index) => {
                  this.logger.info('Patient History Value', value);
                  if (Object.keys(value).length > 0) {
                    this.histories.push(<PatientVisitHistory>value);
                  }
                });
              }
            },
            err => {
              this.alertService.error(JSON.stringify(err.error.message));
            }
          );
      }
    }
  }

  copyPrescription(data) {
    this.logger.info('incoming prescription--', data);
    this.copiedPrescription.emit(data);
  }
}
