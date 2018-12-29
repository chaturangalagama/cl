import { DB_FULL_DATE_FORMAT } from '../../../../constants/app.constants';
import { AppConfigService } from '../../../../services/app-config.service';
import { AlertService } from '../../../../services/alert.service';
import { ApiPatientVisitService } from '../../../../services/api-patient-visit.service';
import { DisplayDatePipe } from '../../../../pipes/display-date.pipe';
import { DrugDispatch, DispatchDrugDetail } from '../../../../objects/request/DrugDispatch';
import { PatientVisitHistory } from '../../../../objects/request/PatientVisitHistory';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { LoggerService } from '../../../../services/logger.service';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

@Component({
  selector: 'app-consultation-history-item',
  templateUrl: './consultation-history-item.component.html',
  styleUrls: ['./consultation-history-item.component.scss']
})
export class ConsultationHistoryItemComponent implements OnInit {
  @Input() mData: ConsultationHistoryItem[];
  @Input() patientVisitHistory: PatientVisitHistory;
  @Output() copyPrescription = new EventEmitter<DispatchDrugDetail[]>();

  isAccordionOpen: boolean;

  constructor(
    private apiPatientVisitService: ApiPatientVisitService,
    private alertService: AlertService,
    private appConfigService: AppConfigService
  ) {}

  ngOnInit() {
    this.isAccordionOpen = false;
    console.log('Patient Visit History MDATA', this.patientVisitHistory);
    console.log('_MDATA_', this.isAccordionOpen);
  }

  copyConsultationPrescription() {
    this.copyPrescription.emit(this.patientVisitHistory.consultation.drugDispatch.dispatchDrugDetail);
  }

  onDownloadNewDocument(patientVisitRegistryId, fileId, fileName) {
    this.apiPatientVisitService.downloadDocument('visit', patientVisitRegistryId, fileId).subscribe(
      res => {
        saveAs(res, fileName);
      },
      err => this.alertService.error(JSON.stringify(err))
    );
  }

  showCopyPrescription() {
    const isShow =
      this.patientVisitHistory.consultation.consultationStartTime &&
      moment(this.patientVisitHistory.consultation.consultationStartTime, DB_FULL_DATE_FORMAT).isSameOrAfter(
        moment(this.appConfigService.getConfig().SHOW_COPY_PRESCRIPTION_AFTER, DB_FULL_DATE_FORMAT)
      );
    return isShow;
  }
}

export class ConsultationHistoryItem {
  title: string;
  date: string;
  prescriptions: ConsultationHistoryPrescription[];
  treatmentNotes: string;
  name: string;
  documents: string[];

  constructor(
    title?: string,
    date?: string,
    prescriptions?: ConsultationHistoryPrescription[],
    treatmentNotes?: string,
    name?: string,
    documents?: string[]
  ) {
    this.title = title || '';
    this.date = date || '';
    this.prescriptions = prescriptions || [
      new ConsultationHistoryPrescription(),
      new ConsultationHistoryPrescription()
    ];
    this.treatmentNotes = treatmentNotes || '';
    this.name = name || '';
    this.documents = documents || ['CT Scan', 'Test', 'Report'];
  }
}

export class ConsultationHistoryPrescription {
  prescription: string;
  quantity: string;

  constructor(prescription?: string, quantity?: string) {
    this.prescription = prescription || 'Prescription';
    this.quantity = quantity || '0';
  }
}
