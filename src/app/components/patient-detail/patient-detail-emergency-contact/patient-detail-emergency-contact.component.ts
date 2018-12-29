import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';

@Component({
    selector: 'app-patient-detail-emergency-contact',
    templateUrl: './patient-detail-emergency-contact.component.html',
    styleUrls: ['./patient-detail-emergency-contact.component.scss']
})
export class PatientDetailEmergencyContactComponent implements OnInit {
    @Input() emergencyContactFormGroup: FormGroup;

    constructor() {}

    ngOnInit() {}
}
