import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'app-patient-history-list',
    templateUrl: './patient-history-list.component.html',
    styleUrls: ['./patient-history-list.component.scss']
})
export class PatientHistoryListComponent implements OnInit {
    @Input() formGroup: FormGroup;

    constructor() {}

    ngOnInit() {}

    onBtnDetailClicked(index) {
        const patientDetailFormGroup = this.formGroup.parent as FormGroup;
        patientDetailFormGroup.patchValue({
            isHistoryList: false,
            historyDetailIndex: index,
        });
    }

    onBtnEditClicked(index) {}

    onBtnDeleteClicked(index) {}
}
