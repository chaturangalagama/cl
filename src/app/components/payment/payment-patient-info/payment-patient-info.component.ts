import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';

@Component({
    selector: 'app-payment-patient-info',
    templateUrl: './payment-patient-info.component.html',
    styleUrls: ['./payment-patient-info.component.scss']
})
export class PaymentPatientInfoComponent implements OnInit {
    @Input() patientInfoFormGroup: FormGroup;

    constructor() {}

    ngOnInit() {}
}
