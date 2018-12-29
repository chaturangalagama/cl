import { ConsultationFormService } from './../../../services/consultation-form.service';
import { FormArray } from '@angular/forms';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-consultation-laboratory',
  templateUrl: './consultation-laboratory.component.html',
  styleUrls: ['./consultation-laboratory.component.scss']
})
export class ConsultationLaboratoryComponent implements OnInit {
  @Input() itemsFormArray: FormArray;
  expanded = true;

  constructor(private consultationFormService: ConsultationFormService) {}

  isAllChargeCodeEntered = false;

  ngOnInit() {}

  onBtnAddClicked() {
    // this.consultationFormService.initIssuedMedicalTestDetails();
    this.consultationFormService.addMultipleIssuedMedicalTestDetails(3);
  }

  onDelete(index: number) {
    this.itemsFormArray.removeAt(index);
  }
}
