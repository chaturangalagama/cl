import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-patient-add-patient-info',
  templateUrl: './patient-add-patient-info.component.html',
  styleUrls: ['./patient-add-patient-info.component.scss']
})
export class PatientAddPatientInfoComponent implements OnInit {
  @Input() basicInfoFormGroup: FormGroup;
  phone_number = '2342342';
  maxDate: Date;

  constructor() {}

  ngOnInit() {
    this.maxDate = new Date();
  }

  resetIDControlErrors($event) {
    console.log('reset ID');
  }

  onInput($event) {
    console.log('EVENT: ', $event);
  }
}
