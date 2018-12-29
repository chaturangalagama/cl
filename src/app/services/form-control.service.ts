import { FormControl, Validators, FormGroup } from '@angular/forms';
import { FormBase } from './../model/FormBase';
import { Injectable } from '@angular/core';

@Injectable()
export class FormControlService {
    group: any = {};
    constructor() {}

    toFormGroup(questions: FormBase<any>[]) {
        // const group: any = {};

        // questions.forEach(question => {
        //     group[question.key] = question.required
        //         ? new FormControl(question.value || '', Validators.required)
        //         : new FormControl(question.value || '');
        // });

        console.log('QUESTIONS ', questions);
        questions.forEach(question => {
            if (question.controlType === 'formgroup') {
                this.group[question.key] = this.toChildFormGroup(
                    question.formControls
                );
                return;
            }
            this.group[question.key] = question.validation
                ? new FormControl(question.value || '', question.validation)
                : new FormControl(question.value || '');
        });

        console.log('FORM GROUP ', this.group);
        return new FormGroup(this.group);
    }

    toChildFormGroup(questions: FormBase<any>[]) {
        const group: any = {};
        questions.forEach(question => {
            console.log('QUESTION ', question);
            group[question.key] = question.validation
                ? new FormControl(question.value || '', question.validation)
                : new FormControl(question.value || '');
        });
        return new FormGroup(group);
    }
}
