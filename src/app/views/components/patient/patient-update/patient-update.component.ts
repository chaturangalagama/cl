import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { AddVaccinationComponent } from './../../vaccination/add-vaccination/add-vaccination.component';
import { VaccinationService } from './../../../../services/vaccination.service';
import { MedicalCoverageAdd, CoveragePlan } from './../../../../objects/MedicalCoverageAdd';
import { Vaccination, VaccinationSchedule } from './../../../../objects/Vaccination';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { PatientSearchResponse } from './../../../../objects/response/PatientSearchResponse';
import { FormBase } from './../../../../model/FormBase';

import { FormGroup, FormControl, Validators } from '@angular/forms';

import { Component, OnInit } from '@angular/core';
import { Input } from '@angular/core/src/metadata/directives';
import { ActivatedRoute, Router } from '@angular/router';

import { UserRegistration } from '../../../../objects/UserRegistration';
import { PolicyHolderService } from '../../../../services/policy-holder.service';
import {
  AssignMedicalCoverageComponent,
  SelectedItem
} from '../../medical-coverage/assign-medical-coverage/assign-medical-coverage.component';
import { DatePipe } from '@angular/common';
import { AlertService } from '../../../../services/alert.service';
import { ApiPatientInfoService } from '../../../../services/api-patient-info.service';

@Component({
  selector: 'app-patient-update',
  templateUrl: './patient-update.component.html',
  styleUrls: ['./patient-update.component.scss']
})
export class PatientUpdateComponent implements OnInit {
  value: string;
  type: string;

  bsConfig: Partial<BsDatepickerConfig>;

  minDate = new Date(2017, 5, 10);
  maxDate = new Date(2018, 9, 15);

  coverageData: any;

  updatePatientForm: FormGroup;

  // userId: FormGroup;
  contactNumber: FormGroup;
  // address: FormGroup;
  emergencyContactNumber: FormGroup;

  number: FormControl;
  idType: FormControl;

  name: FormControl;
  dob: FormControl;
  gender: FormControl;
  status: FormControl;
  emailAddress: FormControl;
  nationality: FormControl;
  maritalStatus: FormControl;
  occupation: FormControl;

  address: FormControl;
  country: FormControl;
  postalCode: FormControl;

  countryCode: FormControl;
  phoneNumber: FormControl;

  emergencyCountryCode: FormControl;
  emergencyPhoneNumber: FormControl;

  // countryCode1: FormControl;
  // number1: FormControl;

  remarks: FormControl;
  patientData: PatientSearchResponse;

  // Vaccination
  vaccinationBsModalRef: BsModalRef;
  vaccinationData: Vaccination;
  scheduledVaccinationData = new Vaccination();
  vaccinationName: string;
  givenDate: Date;
  placeGiven: string;
  vaccinationSchedules = new VaccinationSchedule();

  // Medical Coverage
  coverageBsModalRef: BsModalRef;
  specialRemarks: string;
  startDate: Date;
  endDate: Date;
  selectedMedicalCoverage: SelectedItem[];

  phone_number: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiPatientInfoService: ApiPatientInfoService,
    private alertService: AlertService,
    private modalService: BsModalService,
    private vaccinationService: VaccinationService,
    private policyHolderService: PolicyHolderService
  ) {
    this.route.params.subscribe(params => {
      console.log(params);
      if (params['value']) {
        this.value = params['value'];
        console.log('has params');
      }
      if (params['type']) {
        this.type = params['type'];
        console.log('has params');
      }
    });
  }

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    if (this.value && this.type) {
      this.apiPatientInfoService.searchBy(this.type, this.value).subscribe(
        res => {
          if (res) {
            console.log('RES ', res);
            this.patientData = res.payload;
            this.updatePatientForm.patchValue(res.payload);
          }
        },
        err => {
          this.alertService.error(JSON.stringify(err.error.message));
        }
      );
    }
  }

  onSubmit() {
    // this.payLoad = JSON.stringify(this.updatePatientForm.value);
    // const userRegistration = new UserRegistration(this.form.value);
    this.apiPatientInfoService.update(this.patientData.id, this.updatePatientForm.value).subscribe(
      res => {
        if (res) {
          console.log('RES ', res);
          // this.form.patchValue(res.payload);

          console.log('addVaccination() data ', {
            vaccineId: this.vaccinationData.id,
            givenDate: this.givenDate.getTime(),
            placeGiven: this.placeGiven,
            vaccinationSchedules: [
              {
                vaccineId: this.scheduledVaccinationData.id,
                scheduledDate: this.vaccinationSchedules.scheduledDate.getTime()
              }
            ]
          });

          this.vaccinationService
            .addVaccination(res.payload.id, {
              vaccineId: this.vaccinationData.id,
              givenDate: this.givenDate.getTime(),
              placeGiven: this.placeGiven,
              vaccinationSchedules: [
                {
                  vaccineId: this.scheduledVaccinationData.id,
                  scheduledDate: this.vaccinationSchedules.scheduledDate.getTime()
                }
              ]
            })
            .subscribe(
              resVaccine => {
                this.assignPolicies(res.payload.name, res.message, 0);
              },
              errVaccine => {
                this.alertService.error(errVaccine.error.message);
                console.log('Error occured', errVaccine.error.message);

                console.log(errVaccine.headers.get('Content-Type'));
              }
            );
        }
      },
      err => {
        console.log('Error occured', err.error.message);

        console.log(err.headers.get('Content-Type'));
      }
    );
  }

  createFormControls() {
    this.name = new FormControl('', Validators.required);
    this.dob = new FormControl('', Validators.required);
    this.gender = new FormControl('', Validators.required);
    this.idType = new FormControl('', Validators.required);
    this.number = new FormControl('', Validators.required);
    this.countryCode = new FormControl('', Validators.required);
    this.phoneNumber = new FormControl('', Validators.required);
    // this.countryCode1 = new FormControl('', Validators.required);
    // this.number1 = new FormControl('', Validators.required);
    this.status = new FormControl('', Validators.required);
    this.address = new FormControl('', Validators.required);
    this.country = new FormControl('', Validators.required);
    this.postalCode = new FormControl('', Validators.required);
    this.occupation = new FormControl('');
    this.emailAddress = new FormControl('', Validators.required);
    this.emergencyCountryCode = new FormControl('', Validators.required);
    this.emergencyPhoneNumber = new FormControl('', Validators.required);
    this.nationality = new FormControl('', Validators.required);
    this.maritalStatus = new FormControl('', Validators.required);
    this.remarks = new FormControl();

    this.contactNumber = new FormGroup({
      countryCode: this.countryCode,
      number: this.phoneNumber
    });

    this.emergencyContactNumber = new FormGroup({
      countryCode: this.emergencyCountryCode,
      number: this.emergencyPhoneNumber
    });
  }

  createForm() {
    this.updatePatientForm = new FormGroup({
      name: this.name,
      dob: this.dob,
      userId: new FormGroup({
        idType: this.idType,
        number: this.number
      }),
      gender: this.gender,
      contactNumber: this.contactNumber,
      status: this.status,
      address: new FormGroup({
        address: this.address,
        country: this.country,
        postalCode: this.postalCode
      }),
      emailAddress: this.emailAddress,
      emergencyContactNumber: this.emergencyContactNumber,
      nationality: this.nationality,
      occupation: this.occupation,
      maritalStatus: this.maritalStatus,
      remarks: this.remarks
    });
  }

  addVaccination(event) {
    this.vaccinationBsModalRef = this.modalService.show(AddVaccinationComponent);
    this.vaccinationBsModalRef.content.event.subscribe(data => {
      this.vaccinationData = data;
      this.vaccinationBsModalRef.content.event.unsubscribe();
      this.vaccinationBsModalRef.hide();
    });
  }

  selectScheduledVaccine(event) {
    this.vaccinationBsModalRef = this.modalService.show(AddVaccinationComponent);
    this.vaccinationBsModalRef.content.event.subscribe(data => {
      this.scheduledVaccinationData = data;
      this.vaccinationBsModalRef.content.event.unsubscribe();
      this.vaccinationBsModalRef.hide();
    });
  }

  addMedicalCoverage(event) {
    this.coverageBsModalRef = this.modalService.show(AssignMedicalCoverageComponent, { class: 'modal-lg' });

    if (this.selectedMedicalCoverage) {
      this.coverageBsModalRef.content.setSelectedItems(this.selectedMedicalCoverage);
    }

    this.coverageBsModalRef.content.event.subscribe(data => {
      console.log('addMedicalCoverage()', data);
      this.selectedMedicalCoverage = data;
      this.coverageBsModalRef.content.event.unsubscribe();
      this.coverageBsModalRef.hide();
      // this.coverageData = data[1];
      // this.planData = data[0];
      // this.patientCoverageId = data[2];
      // console.log('coverageData', this.coverageData);
      // console.log('planData', this.planData);
    });
  }

  assignPolicies(name, message, index) {
    if (this.selectedMedicalCoverage.length === index) {
      this.alertService.success(message);
      return;
    }

    const datePipe = new DatePipe('en');
    this.coverageData = this.selectedMedicalCoverage[index].coverageSelected;
    const planData = this.selectedMedicalCoverage[index].planSelected;

    console.log('assignPolicies', {
      identificationNumber: {
        number: this.number.value,
        idType: this.idType.value
      },
      name: name,
      medicalCoverageId: this.coverageData.id,
      planId: planData.id,
      specialRemarks: this.specialRemarks,
      patientCoverageId: this.selectedMedicalCoverage[index].employeeNo,
      startDate: '15/01/2018',
      endDate: '15/01/2018'
    });
    this.apiPatientInfoService
      .assignPolicy(this.coverageData.type, {
        identificationNumber: {
          number: this.number.value,
          idType: this.idType.value
        },
        name: name,
        medicalCoverageId: this.coverageData.id,
        planId: planData.id,
        patientCoverageId: this.selectedMedicalCoverage[index].employeeNo,
        specialRemarks: this.specialRemarks,
        startDate: '15/01/2018',
        endDate: '15/01/2018'
      })
      .subscribe(
        resCoverage => {
          this.assignPolicies(name, message, index + 1);
        },
        errCoverage => {
          this.alertService.error(errCoverage.error.message);
          console.log('Error occured', errCoverage.error.message);

          console.log(errCoverage.headers.get('Content-Type'));
        }
      );
  }
}
