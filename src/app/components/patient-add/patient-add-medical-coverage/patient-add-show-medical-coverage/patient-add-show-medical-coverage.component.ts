import { ApiPatientInfoService } from './../../../../services/api-patient-info.service';
import { StoreService } from './../../../../services/store.service';
import {
  AssignMedicalCoverageComponent,
  SelectedItem
} from './../../../../views/components/medical-coverage/assign-medical-coverage/assign-medical-coverage.component';
import { Component, OnInit, Input, EventEmitter, ElementRef } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { MedicalCoverageAdd, CoveragePlan } from './../../../../objects/MedicalCoverageAdd';
import { PatientDetailMedicalCoverageComponent } from './../../../patient-detail/patient-detail-medical-coverage/patient-detail-medical-coverage.component';
import { SelectedPlan } from '../../../../objects/MedicalCoverage';
import { PatientAddMedicalCoverageSummaryComponent } from '../../patient-add-medical-coverage-summary/patient-add-medical-coverage-summary.component';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-patient-add-show-medical-coverage',
  templateUrl: './patient-add-show-medical-coverage.component.html',
  styleUrls: ['./patient-add-show-medical-coverage.component.scss']
})
export class PatientAddShowMedicalCoverageComponent implements OnInit {
  //   @Input() medicalCoverageFormGroup: FormGroup;
  @Input() selectedPlans: FormArray;
  public event: EventEmitter<any> = new EventEmitter();
  selectedItems: SelectedItem[];

  isAllEmployeeNoEntered = false;

  // Medical Coverage Modal
  bsModalRef: BsModalRef;

  isCollapsed: boolean;

  constructor(
    private fb: FormBuilder,
    private modalService: BsModalService,
    private eRef: ElementRef,
    private store: StoreService,
    private alertService: AlertService,
    private apiPatientInfoService: ApiPatientInfoService
  ) {}

  ngOnInit() {
    console.log('SELECTEDPLANS: ', this.selectedPlans);
    //console.log('medicalCoverageFormGroup AA: ', this.medicalCoverageFormGroup);
  }

  addMedicalCoverage(event) {
    const initialState = {
      title: 'Medical Coverage',
      itemArray: this.selectedPlans
    };
    this.bsModalRef = this.modalService.show(AssignMedicalCoverageComponent, {
      initialState,
      class: 'modal-lg',
      backdrop: 'static',
      keyboard: false
    });
    if (this.selectedItems) {
      this.bsModalRef.content.setSelectedItems(this.selectedItems);
    }

    this.bsModalRef.content.event.subscribe(data => {
      if (data) {
        console.log('POP UP RETURNED DATA', data);

        // The data return is in FormArray of objects/MedicalCoverage.SelectedPlan
        this.selectedPlans = data;
        this.selectedPlans.updateValueAndValidity();
        this.bsModalRef.content.event.unsubscribe();
        this.bsModalRef.hide();
      }
    });
  }

  onShowExtraClicked(index) {
    // let i: number;
    // for (i = 0; i < this.selectedItems.length; i++) {
    //   this.selectedItems[i].showExtra = i === index;
    // }
    // const ref = this.eRef.nativeElement.querySelector('popoverbtn' + index);
    // if (ref) {
    //   ref.hide();
    // }
    this.isCollapsed = !this.isCollapsed;
  }

  onbtnDeleteClicked(index, $event) {
    console.log('selectedItems array: onbtnDeleteclicked');
    console.log('selectedItems array: ', this.selectedPlans.at(index));
    console.log('is new: ', this.selectedPlans.at(index).get('isNew').value);
    console.log('index: ', index);

    if (!this.selectedPlans.at(index).get('isNew').value) {
      this.apiPatientInfoService
        .removePolicy(
          this.selectedPlans.at(index).get('id').value,
          this.selectedPlans.at(index).get('coverageType').value,
          this.selectedPlans.at(index).get('medicalCoverageId').value,
          this.selectedPlans.at(index).get('planId').value
        )
        .subscribe(
          resp => {
            console.log('success');
            this.selectedPlans.removeAt(index);
          },
          err => {
            this.alertService.error('Error from medical coverage removal', err);
          }
        );
    } else {
      this.selectedPlans.removeAt(index);
    }
  }

  insertDropdownRow() {
    this.selectedItems.push(new SelectedItem());
  }

  showItemDetails(index) {
    let i: number;
    for (i = 0; i < this.selectedItems.length; i++) {
      this.selectedItems[i].showExtra = i === index;
    }
    const ref = this.eRef.nativeElement.querySelector('popoverbtn' + index);
    if (ref) {
      ref.hide();
    }
  }

  onBtnAddClicked() {
    this.insertDropdownRow();
    this.onShowExtraClicked(this.selectedItems.length - 1);
    this.isAllEmployeeNoEntered = false;
  }

  onEmployeeIdChanged() {
    // for(let selectedItem: this.selectedItems){

    // }

    this.isAllEmployeeNoEntered = true;
    this.selectedItems.map((value, index) => {
      if (!value.employeeNo || value.employeeNo.trim().length === 0) {
        console.log('isAllEmployeeNoEntered', this.isAllEmployeeNoEntered);
        this.isAllEmployeeNoEntered = false;
        return;
      }
    });
  }
}
