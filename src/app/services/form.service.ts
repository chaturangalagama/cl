import { Injectable } from '@angular/core';
import { FormBase } from '../model/FormBase';
import { DropdownForm } from '../components/forms/form-dropdown';
import { TextboxForm } from '../components/forms/form-textbox';

@Injectable()
export class FormService {
    constructor() {}

    // Todo: get from a remote source of question metadata
    // Todo: make asynchronous
    getQuestions() {
        const questions: FormBase<any>[] = [
            new DropdownForm({
                key: 'brave',
                label: 'Bravery Rating',
                options: [
                    { key: 'solid', value: 'Solid' },
                    { key: 'great', value: 'Great' },
                    { key: 'good', value: 'Good' },
                    { key: 'unproven', value: 'Unproven' }
                ],
                order: 3
            }),

            new TextboxForm({
                key: 'firstName',
                label: 'First name',
                value: 'Bombasto',
                required: true,
                order: 1
            }),

            new TextboxForm({
                key: 'emailAddress',
                label: 'Email',
                type: 'email',
                order: 2
            })
        ];

        return questions.sort((a, b) => a.order - b.order);
    }
}
