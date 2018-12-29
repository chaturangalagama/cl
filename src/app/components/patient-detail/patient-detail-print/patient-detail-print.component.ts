import { PrintTemplateService } from './../../../services/print-template.service';
import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { IOption } from 'ng-select';

import { DISPLAY_DATE_FORMAT, DB_FULL_DATE_FORMAT } from '../../../constants/app.constants';

import { StoreService } from '../../../services/store.service';
import { AlertService } from '../../../services/alert.service';
import { ApiCmsManagementService } from '../../../services/api-cms-management.service';

import { patientLabelTemplate } from '../../../views/templates/patient.label';
import * as moment from 'moment';

@Component({
  selector: 'app-patient-detail-print',
  templateUrl: './patient-detail-print.component.html',
  styleUrls: ['./patient-detail-print.component.scss']
})
export class PatientDetailPrintComponent implements OnInit {
  @Input() patientInfo;

  constructor(
    private store: StoreService,
    private alertService: AlertService,
    private apiCmsManagementService: ApiCmsManagementService,
    private printTemplateService: PrintTemplateService
  ) {}

  ngOnInit() {}

  printTemplate(template: string) {
    const w = window.open();
    w.document.open();
    w.document.write(template);
    w.document.close();
    console.log('document closed');
    w.onload = () => {
      console.log('window loaded');
      w.window.print();
    };
    w.onafterprint = () => {
      w.close();
    };
  }

  onBtnPrintPatientLabelClicked() {
    this.printTemplateService.onBtnPrintPatientLabelClicked(this.patientInfo);
    // this.apiCmsManagementService.searchLabel('PATIENT_LABEL').subscribe(
    //   res => {
    //     const template = JSON.parse(res.payload.template);

    //     const patient = this.patientInfo;
    //     const patientNumber = patient.patientNumber ? patient.patientNumber : '-';
    //     console.log('PATIENT INFO', this.patientInfo);
    //     const clinic = this.store.getClinicList().find(clinic => clinic.id === this.store.getClinicId());
    //     const html = template
    //       .replace(
    //         '{{clinicAddress}}',
    //         `${clinic.address.address.toUpperCase() || ''}, SINGAPORE ${clinic.address.postalCode}`
    //       )
    //       .replace('{{clinicTel}}', clinic.contactNumber)
    //       .replace('{{clinicFax}}', clinic.faxNumber)
    //       .replace('{{id}}', patientNumber)
    //       .replace('{{name}}', patient.name.toUpperCase())
    //       .replace('{{gender}}', patient.gender)
    //       .replace('{{dob}}', patient.dob)
    //       .replace('{{userIdType}}', patient.userId.idType)
    //       .replace('{{userId}}', patient.userId.number)
    //       .replace('{{contact}}', patient.contactNumber.number)
    //       .replace(
    //         '{{address}}',
    //         `${patient.address.address}, ${patient.address.country} ${patient.address.postalCode}`
    //       )
    //       .replace('{{company}}', patient.company ? patient.company.name : '')
    //       .replace(
    //         '{{allergies}}',
    //         patient.allergies && patient.allergies.length
    //           ? patient.allergies.map(allergy => allergy.name).join(', ')
    //           : 'NIL'
    //       );
    //     this.printTemplate(html);
    //   },
    //   err => this.alertService.error(JSON.stringify(err.error['message']))
    // );
  }
}
