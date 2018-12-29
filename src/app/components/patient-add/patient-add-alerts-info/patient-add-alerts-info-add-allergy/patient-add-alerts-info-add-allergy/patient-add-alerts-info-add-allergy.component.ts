import { AlertService } from './../../../../../services/alert.service';
import { Component, OnInit, ElementRef, HostListener, Input, ChangeDetectionStrategy } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { StoreService } from '../../../../../services/store.service';
import { FORMERR } from 'dns';
import { timer } from 'rxjs';

@Component({
  selector: 'app-patient-add-alerts-info-add-allergy',
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './patient-add-alerts-info-add-allergy.component.html',
  styleUrls: ['./patient-add-alerts-info-add-allergy.component.scss']
})
export class PatientAddAlertsInfoAddAllergyComponent implements OnInit {
  selectedAllergyType: string[];
  alertFormGroup: FormGroup;
  title: string;
  drugList: any;
  allergyGroupList: any;

  public selectedEvent: EventEmitter<IOption> = new EventEmitter();

  constructor(
    private fb: FormBuilder,
    public bsModalRef: BsModalRef,
    private eRef: ElementRef,
    private store: StoreService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    const source = timer(500);
    const subscribe = source.subscribe(val => {
      this.selectedAllergyType = [];
      this.drugList = this.store.drugList;
      this.populateAllergyGroupList();
    });

    console.log('DRUG LIST: ', this.drugList);
    //	this.populateAllergyGroupList();
  }

  populateAllergyGroupList() {
    if (this.store.allergyGroupList.length < 1) {
      if (this.store.errorMessages['listAllergyGroups'] !== undefined) {
        this.alertService.error(JSON.stringify(this.store.errorMessages['listAllergyGroups']));
      } else {
        this.store.getAllergyGroupList();
      }
    } else {
      this.allergyGroupList = this.store.allergyGroupList;

      console.log('this.allergygrouplist: ', this.allergyGroupList);
    }
  }

  onSelect($event) {
    console.log('selected allergy', event);
    this.populateAllergyGroupList();
  }

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.eRef.nativeElement.contains(event.target)) {
      //	console.log('Selected Allergy Types: ', this.selectedAllergyType);
    } else {
      // this.text = 'clicked outside';
      //   console.log('clicked outside Medical Coverage Summary', event.target);
    }
  }
  onbtnDeleteClicked() {}

  onDelete(form: FormGroup, index: number) {
    form.patchValue({
      isDelete: true,
      deleteIndex: index
    });
    const formArray = form.parent as FormArray;

    // if (index === 0 && this.alertFormGroup.get('alertArray').value.length === 1) {
    // if (index > 0) {
    //   if (
    //     this.alertFormGroup.get('alertArray').value[0].type !== '' ||
    //     this.alertFormGroup.get('alertArray').value[0].name !== '' ||
    //     this.alertFormGroup.get('alertArray').value[0].remark !== ''
    //   ) {
    //     // Initialised first row
    //     formArray.removeAt(index);
    //     this.onBtnAdd(this.alertFormGroup);
    //   } else {
    //     console.log('Do nothing');
    //   }
    // } else {
    //   formArray.removeAt(index);
    // }

    formArray.removeAt(index);
  }

  onBtnAdd(form: FormGroup) {
    form.patchValue({
      isAdd: true
    });
  }

  onBtnSave(form: FormGroup) {
    //remove empty values
    const listOfAllergies = form.value;

    console.log('listofallergies: ', listOfAllergies);

    this.bsModalRef.hide();
  }

  onBtnExit(form: FormGroup) {
    const listOfAllergies = form.get('alertArray') as FormArray;

    listOfAllergies.value.forEach((allergy, index) => {
      if (allergy.name === '' || allergy.type === '') {
        listOfAllergies.removeAt(index);
      }
    });

    // listOfAllergies.updateValueAndValidity();
    this.bsModalRef.hide();
  }
}
