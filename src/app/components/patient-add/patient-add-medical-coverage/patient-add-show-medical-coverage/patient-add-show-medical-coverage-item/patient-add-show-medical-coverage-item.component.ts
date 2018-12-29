import { CapPerVisit, Copayment, ContactPerson } from './../../../../../objects/MedicalCoverage';
import { AlertService } from './../../../../../services/alert.service';
import { ApiPatientInfoService } from './../../../../../services/api-patient-info.service';
import { FormGroup } from '@angular/forms';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-patient-add-show-medical-coverage-item',
  templateUrl: './patient-add-show-medical-coverage-item.component.html',
  styleUrls: ['./patient-add-show-medical-coverage-item.component.scss']
})
export class PatientAddShowMedicalCoverageItemComponent implements OnInit {
  @Input() item: FormGroup;
  @Input() index: number;
  @Output() onDelete = new EventEmitter<number>();
  isCollapsed: boolean;
  constructor(private apiPatientInfoService: ApiPatientInfoService, private alertService: AlertService) { }

  ngOnInit() {
    console.log('Coverage Items', this.item);
    this.isCollapsed = false;
    // if (this.index === 0) {
    //   this.isCollapsed = false;
    // }
    this.subscribeFormGroupChanges();
  }

  onShowExtraClicked(index) {
    this.isCollapsed = !this.isCollapsed;
  }

  onbtnDeleteClicked() {
    console.log('delete this row');
    this.onDelete.emit(this.index);

    // console.log('THIS ITEM:', this.item.get('isNew'));

    // if (!this.item.get('isNew')) {
    //   this.apiPatientInfoService
    //     .removePolicy(
    //       this.item.get('id').value,
    //       this.item.get('coverageType').value,
    //       this.item.get('medicalCoverageId').value,
    //       this.item.get('planId').value
    //     )
    //     .subscribe(
    //       resp => {
    //         console.log('success');
    //       },
    //       err => {
    //         this.alertService.error('Error from medical coverage removal', err);
    //       }
    //     );
    // }
  }

  patchDataToDetail() {
    console.log('::: PATient add: ', this.item);

    const copayment: Copayment = {
      value: this.item.get('planSelected').value.copayment.value,
      paymentType: this.item.get('planSelected').value.copayment.paymentType
    }

    const address = this.item.get('coverageSelected').value.address;
    const firstContact = this.item.get('coverageSelected').value.contacts;
    const contact: ContactPerson = {
      name: firstContact.name,
      title: firstContact.title,
      mobileNumber: firstContact.mobileNumber,
      directNumber: firstContact.directNumber,
      faxNumber: firstContact.faxNumber,
      email: firstContact.email
    }

    const coveragePlan: any = {
      capPerVisit: {
        limit: this.item.get('planSelected').value.capPerVisit.limit
      },
      capPerWeek: {
        limit: this.item.get('planSelected').value.capPerWeek.limit
      },
      capPerMonth: {
        limit: this.item.get('planSelected').value.capPerMonth.limit
      },
      capPerYear: {
        limit: this.item.get('planSelected').value.capPerYear.limit
      },
      capPerLifeTime: {
        limit: this.item.get('planSelected').value.capPerLifeTime.limit
      },
      copayment: copayment,
      clinicRemarks: this.item.get('planSelected').value.clinicRemarks,
      paymentRemarks: this.item.get('planSelected').value.paymentRemarks,
      registrationRemarks: this.item.get('planSelected').value.registrationRemarks,
    }



    const policyHolder: any = {
      specialRemarks: this.item.get('remarks').value,
      startDate: this.item.get('startDate').value,
      endDate: this.item.get('endDate').value
    }
    const item: any = {
      coveragePlan: coveragePlan,
      policyHolder: policyHolder,
      contacts: firstContact,
      address: address
    }

    console.log("this.item: ", item);
    return item;
  }

  subscribeFormGroupChanges() {
    this.item.valueChanges
      .pipe(distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        console.log("DIFFERENT VALUES: ", values);
      });
  }

  getSubHeaderClass() {
    if (!this.isCollapsed) {
      return 'row modal-sub-header modal-input1 p-2';
    } else {
      return 'row modal-sub-header-expanded modal-input1 p-2';
    }
  }
}
