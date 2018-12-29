import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';

@Component({
    selector: 'app-patient-detail-company-info',
    templateUrl: './patient-detail-company-info.component.html',
    styleUrls: ['./patient-detail-company-info.component.scss']
})
export class PatientDetailCompanyInfoComponent implements OnInit {
    @Input() companyInfoFormGroup: FormGroup;

    constructor() {}

    ngOnInit() {}
}
