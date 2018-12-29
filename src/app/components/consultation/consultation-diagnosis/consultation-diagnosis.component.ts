import { ConsultationFormService } from './../../../services/consultation-form.service';
import { StoreService } from './../../../services/store.service';
import { Input } from '@angular/core';
import { HttpResponseBody } from './../../../objects/response/HttpResponseBody';
import { FormControl, FormArray } from '@angular/forms';
import { ApiCmsManagementService } from './../../../services/api-cms-management.service';
import { Component, OnInit } from '@angular/core';
import { IOption } from 'ng-select';
import { SelectItemOptions } from '../../../objects/SelectItemOptions';

import { Observable } from 'rxjs';

@Component({
  selector: 'app-consultation-diagnosis',
  templateUrl: './consultation-diagnosis.component.html',
  styleUrls: ['./consultation-diagnosis.component.scss']
})
export class ConsultationDiagnosisComponent implements OnInit {
  @Input() diagnosisIds: FormArray;

  constructor(private consultationFormService: ConsultationFormService) {}

  ngOnInit() {}

  onBtnAddClicked() {
    console.log('ADD Item');
    this.consultationFormService.initDiagnosis();
  }

  onBtnDeleteClicked(index) {
    // this.diagnosisIds.removeAt(index);

    this.consultationFormService.removeDiagnosis(index);
  }
}
