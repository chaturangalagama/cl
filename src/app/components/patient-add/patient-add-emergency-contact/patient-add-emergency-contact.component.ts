import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';

@Component({
  selector: 'app-patient-add-emergency-contact',
  templateUrl: './patient-add-emergency-contact.component.html',
  styleUrls: ['./patient-add-emergency-contact.component.scss']
})
export class PatientAddEmergencyContactComponent implements OnInit {
@Input() emergencyContactFormGroup: FormGroup;

  constructor() { }

  ngOnInit() {
  }

}
