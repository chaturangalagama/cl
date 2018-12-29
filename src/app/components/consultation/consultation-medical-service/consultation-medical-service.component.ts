import { ConsultationFormService } from './../../../services/consultation-form.service';
import { MedicalServiceService } from './../../../services/medical-service.service';
import { FormArray } from '@angular/forms';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-consultation-medical-service',
  templateUrl: './consultation-medical-service.component.html',
  styleUrls: ['./consultation-medical-service.component.scss']
})
export class ConsultationMedicalServiceComponent implements OnInit {
  @Input() itemsFormArray: FormArray;
  constructor(private consultationFormService: ConsultationFormService) {}

  ngOnInit() {}

  onBtnAddClicked() {
    // this.consultationFormService.initMedicalServiceGiven();
    this.consultationFormService.addMultipleMedicalService(3);
  }

  onDelete(index: number) {
    this.itemsFormArray.removeAt(index);
  }
}
