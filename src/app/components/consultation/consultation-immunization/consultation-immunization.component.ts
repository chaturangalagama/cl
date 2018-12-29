import { ConsultationFormService } from './../../../services/consultation-form.service';
import { FormArray } from '@angular/forms';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-consultation-immunization',
  templateUrl: './consultation-immunization.component.html',
  styleUrls: ['./consultation-immunization.component.scss']
})
export class ConsultationImmunizationComponent implements OnInit {
  @Input() itemsFormArray: FormArray;
  minDate = new Date(2017, 5, 10);
  maxDate = new Date(2018, 9, 15);

  bsValue: Date = new Date();
  bsRangeValue: any = [new Date(2017, 7, 4), new Date(2017, 7, 20)];

  immunizationItems: Immunization[] = [];

  constructor(private consultationFormService: ConsultationFormService) {}

  ngOnInit() {
    // if (this.immunizationItems.length === 0) {
    //     this.onBtnAddClicked();
    // }
  }

  onBtnAddClicked() {
    console.log('ADD Item');
    // this.immunizationItems.push(new Immunization());
    // this.consultationFormService.initImmunisation();
    this.consultationFormService.addMultipleImmunisation(3);
  }

  onDelete(index: number) {
    this.itemsFormArray.removeAt(index);
  }
}

class Immunization {
  vaccine: string;
  dateGiven: Date;
  lotNo: string;
  nextDose: Date;
  branch: string;
}
