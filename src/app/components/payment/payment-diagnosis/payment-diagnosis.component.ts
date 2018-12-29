import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { IOption } from 'ng-select';

@Component({
    selector: 'app-payment-diagnosis',
    templateUrl: './payment-diagnosis.component.html',
    styleUrls: ['./payment-diagnosis.component.scss']
})
export class PaymentDiagnosisComponent implements OnInit {
    @Input() diagnosisFormGroup: FormGroup;

    icds: Array<IOption> = [
        { value: '0', label: 'B35.6' },
        { value: '1', label: 'I10.7' }
    ];

    constructor() {}

    ngOnInit() {}
}
