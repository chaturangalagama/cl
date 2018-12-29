import { SelectedItem } from './../../../views/components/medical-coverage/assign-medical-coverage/assign-medical-coverage.component';
import { StoreService } from './../../../services/store.service';
import { ApiCmsManagementService } from './../../../services/api-cms-management.service';
import { FormGroup } from '@angular/forms';
import { Component, OnInit, Input, ElementRef, HostListener, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import { SelectItemOptions } from '../../../objects/SelectItemOptions';
import { Doctor } from '../../../objects/SpecialityByClinic';
import { VisitPurpose } from './../../../objects/request/PatientVisit';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-patient-add-consultation',
  templateUrl: './patient-add-consultation.component.html',
  styleUrls: ['./patient-add-consultation.component.scss']
})
export class PatientAddConsultationComponent implements OnInit, OnDestroy {
  @Input() consultationInfoFormGroup: FormGroup;

  isMeridian = false;
  showSpinners = false;

  doctors: Array<SelectItemOptions<Doctor>>;
  visitPurposes: Array<SelectItemOptions<VisitPurpose>>;

  constructor(
    private eRef: ElementRef,
    private storeService: StoreService,
    private apiCmsManagementService: ApiCmsManagementService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    const currDate: Date = new Date();
    this.consultationInfoFormGroup.get('visitDate').patchValue(currDate);
    this.consultationInfoFormGroup.get('time').patchValue(currDate);

    // this.storeService.getDoctorListByClinic();
    // this.storeService.getVisitPurposeList();

    console.log('doc list', this.storeService.doctorListByClinic);
    console.log('purpose list', this.storeService.visitPurposeList);
    this.populateDoctor();
    this.populateVisitPurposes();
  }

  ngOnDestroy() { }

  populateVisitPurposes() {
    if (this.storeService.visitPurposeList.length < 1) {
      if (this.storeService.errorMessages['visitPurposeList'] !== undefined) {
        this.alertService.error(this.storeService.errorMessages['visitPurposeList']);
      } else {
        this.storeService.getVisitPurposeList();
      }
    } else {
      const tempPurposes = new Array<SelectItemOptions<VisitPurpose>>();
      this.storeService.visitPurposeList.map((value, index) => {
        tempPurposes.push({
          value: value.name,
          label: value.name,
          data: value
        });
      });

      this.visitPurposes = tempPurposes;
    }
  }

  populateDoctor() {
    // this.storeService.getListOfDoctorsByClinic();

    if (this.storeService.doctorListByClinic.length < 1) {
      if (this.storeService.errorMessages['listDoctorsByClinic'] !== undefined) {
        console.log('ERROR MESSAGE PRESENT');
        this.alertService.error(this.storeService.errorMessages['listDoctorsByClinic']);
      } else {
        this.storeService.listDoctorsByClinic();
      }
    } else {
      const tempDoc = new Array<SelectItemOptions<Doctor>>();
      this.storeService.doctorListByClinic.map((value, index) => {
        console.log('DOCTOR LIST', value);
        if (value.status === 'ACTIVE') {
          tempDoc.push({
            value: value.id,
            // label: value.name,
            label: value.displayName,
            data: value
          });
        } else {
          console.log('Doctor is not active. Do nothing');
        }
      });

      this.doctors = tempDoc;
    }
  }

  onDoctorSelected(option) { }
  onPurposeSelected(option) { }

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.eRef.nativeElement.contains(event.target)) {
      console.log('clicked inside AddConsultation');
    } else {
      // this.text = 'clicked outside';
      console.log('clicked outside AddConsultation', event.target);
    }
  }
}
