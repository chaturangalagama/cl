import { MedicalCoverageSelected, CoverageSelected, SelectedPlans } from './../../../objects/MedicalCoverage';
import { Component, OnInit, ElementRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { AttachedMedicalCoverage } from '../../../objects/AttachedMedicalCoverage';

@Component({
  selector: 'app-patient-add-medical-coverage-summary',
  templateUrl: './patient-add-medical-coverage-summary.component.html',
  styleUrls: ['./patient-add-medical-coverage-summary.component.scss']
})
export class PatientAddMedicalCoverageSummaryComponent implements OnInit {
  @Input() medicalCoverageFormArray: FormArray;
  @Input() selectedPlans: SelectedPlans[];
  @Input() hasUpdatePriority: boolean;
  displayIncompatibleMessage: boolean = false;
  incompatibilityMatrix: boolean[];

  @Input() attachedMedicalCoverages: FormArray;
  @Output() updateChange = new EventEmitter();

  isSelected: boolean;
  isCollapsed: boolean[];

  constructor(private eRef: ElementRef, private fb: FormBuilder) { }

  ngOnInit() {
    // this.isCollapsed = [];
    // this.selectedPlans.map((value, index) => {
    //     value['isSelected'] = false;
    //     this.isCollapsed[index] = true;
    // });

    // this.attachedMedicalCoverages = this.fb.array([]);
  }

  collapsed(event: any): void {
    console.log(event);
  }

  expanded(event: any): void {
    console.log(event);
  }

  //   selectedPlanUpdated(attachedMedicalCoverage: AttachedMedicalCoverage) {
  //     (<FormArray>this.medicalCoverageFormGroup.get('attachedMedicalCoverages')).push(this.fb.group(attachedMedicalCoverage));
  //     console.log('emit', attachedMedicalCoverage);
  //   }

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.eRef.nativeElement.contains(event.target)) {
      // console.log('clicked inside Medical Coverage Summary');
      // console.log('SelectedPlans', this.selectedPlans);
      this.updateChange.emit(this.attachedMedicalCoverages);
    } else {
      // this.text = 'clicked outside';
      //   console.log('clicked outside Medical Coverage Summary', event.target);
    }
  }
  setPage(pageInfo) { }

  isPlanSelected(medicalCoverage) {
    const { policyHolder, coveragePlan } = medicalCoverage;

    //   const result = this.selectedCoverages.find(element => {
    //     return element.medicalCoverageId === policyHolder.medicalCoverageId && element.planId === coveragePlan.id;
    //   });

    //   if (result) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }
  }

  isCurrentPlan(coverage, coverageSelected) {
    if (
      coverageSelected.medicalCoverageId === coverage.get('medicalCoverageId').value &&
      coverageSelected.planId === coverage.get('planId').value
    ) {
      return true;
    } else {
      return false;
    }
  }

  checkAgainstSelectedCoverages(medicalCoverageType, medicalCoverage, index) {
    //get current item

    let isCompatible = true;
    const selectedCoverages = this.attachedMedicalCoverages;

    this.incompatibilityMatrix = [];

    // console.log('medicalCoverage: ', medicalCoverage);
    // console.log('attachedCoverages: ', this.attachedMedicalCoverages);

    selectedCoverages.value.forEach(coverage => {
      if (!this.isCurrentPlan(medicalCoverage, coverage)) {
        const attachedCoverageType = coverage.coverageType;
        // console.log('attachedCoverageType: ', attachedCoverageType);
        // console.log('medicalCoverageType: ', medicalCoverageType);
        if (!this.checkCompatibility(attachedCoverageType, medicalCoverageType)) {
          isCompatible = false;
        }
      } else {
        isCompatible = true;
      }
    });

    // console.log('isCompatible: ', isCompatible);
    return isCompatible;
  }

  checkCompatibility(coverageTypeSelected, siblingCoverageType) {
    const insurance = 'INSURANCE';
    const corporate = 'CORPORATE';
    const chas = 'CHAS';
    const medisave = 'MEDISAVE';

    if (
      coverageTypeSelected === insurance &&
      siblingCoverageType === insurance
      // (siblingCoverageType === insurance && coverageTypeSelected === insurance)
    ) {
      return false;
    } else if (
      (coverageTypeSelected === insurance && siblingCoverageType === corporate) ||
      (siblingCoverageType === insurance && coverageTypeSelected === corporate)
    ) {
      return false;
    } else if (
      coverageTypeSelected === corporate &&
      siblingCoverageType === corporate
      // (siblingCoverageType === corporate && coverageTypeSelected === corporate)
    ) {
      return false;
    } else if (coverageTypeSelected === chas && siblingCoverageType === chas) {
      return false;
    } else if (coverageTypeSelected === medisave && siblingCoverageType === medisave) {
      return false;
    } else {
      return true;
    }
  }

  getSelectedIndex(item) {
    // current selection pool
    // const selectedMedicalCoverageFormArray: FormArray = this.attachedMedicalCoverages;

    // const selectedMedicalCoverageArray = selectedMedicalCoverageFormArray.value;

    const index = this.attachedMedicalCoverages.value.findIndex(element => {
      // console.log('element: ', element);
      // console.log('item: ', item);
      return (
        element.medicalCoverageId === item.get('medicalCoverageId').value && element.planId === item.get('planId').value
      );
    });
    console.log("ATTACH SELECTED: ", this.attachedMedicalCoverages);
    this.updateChange.emit(this.attachedMedicalCoverages);
    return index + 1;
  }
}
