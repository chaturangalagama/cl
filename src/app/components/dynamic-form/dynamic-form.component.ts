import { FormControlService } from './../../services/form-control.service';
import { FormBase } from './../../model/FormBase';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'app-dynamic-form',
    templateUrl: './dynamic-form.component.html',
    providers: [FormControlService]
})
export class DynamicFormComponent implements OnInit {
    @Input() questions: FormBase<any>[] = [];
    form: FormGroup;
    payLoad = '';

    constructor(private qcs: FormControlService) {}

    ngOnInit() {
        this.form = this.qcs.toFormGroup(this.questions);
    }

    onSubmit() {
        this.payLoad = JSON.stringify(this.form.value);
    }
}
