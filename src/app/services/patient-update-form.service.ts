import { Validators } from '@angular/forms';
import { TextareaForm } from './../components/forms/form-textarea';
import { Injectable } from '@angular/core';
import { FormBase } from '../model/FormBase';
import { DropdownForm } from '../components/forms/form-dropdown';
import { TextboxForm } from '../components/forms/form-textbox';
import { FormGroupForm } from '../components/forms/form-formgroup';

@Injectable()
export class PatientUpdateFormService {
    constructor() {}

    // Todo: get from a remote source of question metadata
    // Todo: make asynchronous
    getQuestions() {
        const questions: FormBase<any>[] = [
            // new TextboxForm({
            //     key: 'name',
            //     label: 'Name',
            //     type: 'text',
            //     order: 1,
            //     required: true,
            //     validation: [Validators.required]
            // }),

            // new TextboxForm({
            //     key: 'dob',
            //     label: 'Date of Birth',
            //     value: '',
            //     required: true,
            //     order: 2,
            //     validation: [Validators.required]
            // }),
            new FormGroupForm({
                key: 'userId',
                order: 1,
                formControls: [
                    new DropdownForm({
                        key: 'idType',
                        label: 'ID Type',
                        options: [
                            { key: 'NRIC', value: 'NRIC' },
                            { key: 'FIN', value: 'FIN' },
                            { key: 'MIC', value: 'MIC' },
                            { key: 'PASSPORT', value: 'PASSPORT' }
                        ],
                        order: 3,
                        required: true,
                        validation: [Validators.required],
                        col: 'col-4'
                    }),
                    new TextboxForm({
                        key: 'number',
                        label: 'Number',
                        value: '',
                        required: true,
                        order: 2,
                        validation: [Validators.required],
                        col: 'col-8'
                    })
                ]
            }),
            new TextboxForm({
                key: 'name',
                label: 'Name',
                type: 'text',
                order: 2,
                required: true,
                validation: [Validators.required]
            }),

            new TextboxForm({
                key: 'dob',
                label: 'Date of Birth',
                value: '',
                required: true,
                order: 3,
                validation: [Validators.required]
            }),
            // new DropdownForm({
            //     key: 'idType',
            //     label: 'ID Type',
            //     options: [
            //         { key: 'nric', value: 'NRIC' },
            //         { key: 'fin', value: 'FIN' },
            //         { key: 'mic', value: 'MIC' },
            //         { key: 'passport', value: 'PASSPORT' }
            //     ],
            //     order: 3,
            //     required: true,
            //     validation: [Validators.required]
            // }),
            new DropdownForm({
                key: 'gender',
                label: 'Gender',
                options: [
                    { key: 'MALE', value: 'MALE' },
                    { key: 'FEMALE', value: 'FEMALE' },
                    { key: 'OTHER', value: 'OTHER' }
                ],
                order: 4,
                required: true,
                validation: [Validators.required]
            }),
            new DropdownForm({
                key: 'status',
                label: 'Status',
                options: [
                    { key: 'ACTIVE', value: 'ACTIVE' },
                    { key: 'INACTIVE', value: 'INACTIVE' },
                    { key: 'BLOCKED', value: 'BLOCKED' }
                ],
                order: 5,
                required: true,
                validation: [Validators.required]
            }),
            new FormGroupForm({
                key: 'contactNumber',
                order: 6,
                formControls: [
                    new TextboxForm({
                        key: 'countryCode',
                        label: 'Country Code',
                        value: '',
                        required: true,
                        type: 'number',
                        order: 6,
                        validation: [Validators.required],
                        col: 'col-4'
                    }),
                    new TextboxForm({
                        key: 'number',
                        label: 'Number',
                        value: '',
                        required: true,
                        order: 6,
                        validation: [Validators.required],
                        col: 'col-8'
                    })
                ]
            }),
            // new TextboxForm({
            //     key: 'contactCountryCode',
            //     label: 'Country Code',
            //     value: '',
            //     required: true,
            //     type: 'number',
            //     order: 6,
            //     validation: [Validators.required],
            //     col: 'col-4'
            // }),
            // new TextboxForm({
            //     key: 'contactNumber',
            //     label: 'Number',
            //     value: '',
            //     required: true,
            //     order: 6,
            //     validation: [Validators.required],
            //     col: 'col-8'
            // }),
            new FormGroupForm({
                key: 'address',
                order: 6,
                formControls: [
                    new TextboxForm({
                        key: 'address',
                        label: 'Address',
                        value: '',
                        required: true,
                        order: 7,
                        validation: [Validators.required]
                    }),
                    new TextboxForm({
                        key: 'country',
                        label: 'Country',
                        value: '',
                        required: true,
                        order: 8,
                        validation: [Validators.required]
                    }),
                    new TextboxForm({
                        key: 'postalCode',
                        label: 'Postal Code',
                        value: '',
                        required: true,
                        order: 9,
                        validation: [Validators.required]
                    })
                ]
            }),

            new TextboxForm({
                key: 'emailAddress',
                label: 'Email',
                value: '',
                required: true,
                validation: [
                    Validators.required,
                    Validators.pattern('[^ @]*@[^ @]*')
                ],
                order: 10
            }),
            new FormGroupForm({
                key: 'emergencyContactNumber',
                order: 6,
                formControls: [
                    new TextboxForm({
                        key: 'countryCode',
                        label: 'Country Code',
                        value: '',
                        required: true,
                        type: 'number',
                        order: 11,
                        validation: [Validators.required],
                        col: 'col-4'
                    }),
                    new TextboxForm({
                        key: 'number',
                        label: 'Number',
                        value: '',
                        required: true,
                        order: 12,
                        validation: [Validators.required],
                        col: 'col-8'
                    })
                ]
            }),

            // new TextboxForm({
            //     key: 'occupation',
            //     label: 'Occupation',
            //     value: '',
            //     required: true,
            //     order: 13,
            //     validation: [Validators.required]
            // }),
            new TextboxForm({
                key: 'nationality',
                label: 'Nationality',
                value: '',
                required: true,
                order: 14,
                validation: [Validators.required]
            }),
            // new TextboxForm({
            //     key: 'companyId',
            //     label: 'Company ID',
            //     value: '',
            //     order: 15,
            //     validation: [Validators.required]
            // }),
            new DropdownForm({
                key: 'maritalStatus',
                label: 'Marital Status',
                options: [
                    { key: 'SINGLE', value: 'SINGLE' },
                    { key: 'MARRIED', value: 'MARRIED' },
                    { key: 'DIVORCED', value: 'DIVORCED' }
                ],
                order: 16,
                required: true,
                validation: [Validators.required]
            }),
            new TextareaForm({
                key: 'remarks',
                label: 'Remarks',
                order: 17
            })
        ];

        return questions.sort((a, b) => a.order - b.order);
    }
}
