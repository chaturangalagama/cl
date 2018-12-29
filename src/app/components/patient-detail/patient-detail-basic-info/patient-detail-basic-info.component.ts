import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';

@Component({
  selector: 'app-patient-detail-basic-info',
  templateUrl: './patient-detail-basic-info.component.html',
  styleUrls: ['./patient-detail-basic-info.component.scss']
})
export class PatientDetailBasicInfoComponent implements OnInit {
  @Input() basicInfoFormGroup: FormGroup;
  maxDate: Date;

  constructor() {}

  ngOnInit() {
    this.maxDate = new Date();
  }

  resetIDControlErrors($event) {
    console.log('reset ID');
  }
}
