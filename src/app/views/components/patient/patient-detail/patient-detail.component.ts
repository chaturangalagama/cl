import { SelectedPlan } from './../../../../objects/MedicalCoverage';
import { Clinic as ClinicOnly } from './../../../../objects/response/Clinic';
import { DrugItem } from './../../../../objects/DrugItem';
import { MedicalAlertResponse } from './../../../../objects/response/MedicalAlertResponse';
import { MedicalCoverageFormService } from './../../../../services/medical-coverage-form.service';
import { forkJoin } from 'rxjs';
import { distinctUntilChanged, debounceTime, filter, map } from 'rxjs/operators';
import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { PatientVisit, VisitPurpose } from '../../../../objects/request/PatientVisit';
import { AttachedMedicalCoverage } from '../../../../objects/AttachedMedicalCoverage';
import { StoreService } from '../../../../services/store.service';
import { AlertService } from '../../../../services/alert.service';
import { UtilsService } from './../../../../services/utils.service';

import { ApiCmsManagementService } from '../../../../services/api-cms-management.service';
import { ApiPatientInfoService } from '../../../../services/api-patient-info.service';
import { ApiPatientVisitService } from '../../../../services/api-patient-visit.service';
import { PatientService } from '../../../../services/patient.service';
import * as moment from 'moment';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { TabsetComponent } from 'ngx-bootstrap';
import { MedicalCoverageResponse } from '../../../../objects/response/MedicalCoverageResponse';
import { PatientUpdateConfirmationComponent } from './../../../../components/patient-add/patient-update-confirmation/patient-update-confirmation.component';
import { PatientAddQueueConfirmationComponent } from './../../../../components/patient-add/patient-add-queue-confirmation/patient-add-queue-confirmation.component';
import {
  DISPLAY_DATE_FORMAT,
  DB_FULL_DATE_FORMAT,
  ALLERGY_TYPES,
  ALERT_PRIORITY,
  ALERT_TYPES,
  ALLERGIES,
} from '../../../../constants/app.constants';
import { Address } from '../../../../objects/UserRegistration';
import {
  MedicalCoverageSelected,
  ContactPerson,
  CapPerVisit,
  Copayment,
  CoverageSelected,
  SelectedPlans
} from '../../../../objects/MedicalCoverage';
import { PaymentService } from '../../../../services/payment.service';

@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.scss']
})
export class PatientDetailComponent implements OnInit {
  @ViewChild('tabs') tabs: TabsetComponent;
  isHistoryListInit = false;
  hotKeySaveOnHistoryDetailTab = true;

  patientDetailFormGroup: FormGroup;
  patientInfo;
  histories;
  patientDocuments;
  visitDocuments;
  storedPatientID;
  storedPatientIDType;

  policyHolderInfo: FormArray;
  medicalCoverageFormArray: FormArray;
  confirmationBsModalRef: BsModalRef;
  coverages: MedicalCoverageResponse;
  plans: SelectedPlans[] = [];
  selectedMedicalCoverage: any;
  selectedCoverageType = new Set();

  allergyTypes: any;
  allergyNames: any;

  medicalAlertTypes: any;
  medicalAlertPriorities: any;

  // Medical Alerts
  medicalAlerts: MedicalAlertResponse[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private store: StoreService,
    private alertService: AlertService,
    private modalService: BsModalService,
    private apiCmsManagementService: ApiCmsManagementService,
    private apiPatientInfoService: ApiPatientInfoService,
    private apiPatientVisitService: ApiPatientVisitService,
    private patientService: PatientService,
    private utilsService: UtilsService,
    private fb: FormBuilder,
    private medicalCoverageFormService: MedicalCoverageFormService,
    private paymentService: PaymentService
  ) {
    this.medicalCoverageFormArray = this.fb.array([]);
    this.activatedRoute.params.subscribe(params => {
      if (params['id']) {
        this.store.setPatientId(params['id']);
        this.location.go('/pages/patient/detail');
      }
    });
  }

  ngOnInit() {
    this.activatedRoute.queryParams.pipe(debounceTime(50)).subscribe(params => {
      const tabIndex = params['tabIndex'] || 0;
      if (this.tabs.tabs[tabIndex]) {
        this.tabs.tabs[tabIndex].active = true;
      }
    });

    this.allergyTypes = this.utilsService.mapToDisplayOptions(ALLERGY_TYPES);
    this.allergyNames = this.utilsService.mapToDisplayOptions(ALLERGIES);
    this.medicalAlertTypes = this.utilsService.mapToDisplayOptions(ALERT_TYPES);
    this.medicalAlertPriorities = this.utilsService.mapToDisplayOptions(ALERT_PRIORITY);
    this.patientDetailFormGroup = this.patientService.getPatientDetailFormGroup();

    this.policyHolderInfo = this.fb.array([]);

    if (!this.patientDetailFormGroup.get('selectedPlans').value) {
      this.initSelectedPlans();
      // this.patientDetailFormGroup.get('selectedPlans').patchValue(null);
    }

    if (this.store.getPatientId()) {
      // Get Patient Details
      if (this.patientDetailFormGroup.value.needRefresh) {
        this.apiPatientInfoService.searchBy('systemuserid', this.store.getPatientId()).subscribe(
          res => {
            const patientInfo = (this.patientInfo = res.payload);
            this.apiPatientInfoService.searchAssignedPoliciesByUserId(patientInfo['userId']).subscribe(
              resp => {
                if (resp.payload) {
                  this.coverages = new MedicalCoverageResponse(
                    resp.payload.INSURANCE,
                    resp.payload.CORPORATE,
                    resp.payload.CHAS,
                    resp.payload.MEDISAVE
                  );
                  this.populateData(this.coverages);
                  this.medicalCoverageFormArray.updateValueAndValidity();
                  this.updateFormGroup();
                }
              },
              err => this.alertService.error(JSON.stringify(err))
            );

            this.subscribeValueChanges();
          },
          err => {
            this.alertService.error(JSON.stringify(err));
            this.store.setPatientId('');
            this.router.navigate(['pages/patient/detail']);
          }
        );

        this.getAlerts();
        this.initHistoryList();
      }
    } else {
      alert('No Patient Details');
      this.router.navigate(['pages/patient/list']);
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    this.tabs.tabs.forEach((tab, index) => {
      if (tab.active) {
        switch (index) {
          case 0:
            console.log('on patient detail page;', this.patientDetailFormGroup);
            if (event.keyCode === 115 && this.patientDetailFormGroup.valid) {
              this.hotKeySaveOnHistoryDetailTab = false;
              this.onBtnSaveClicked();
            }
            break;
          case 1:
            console.log('on patient history page;');
            this.hotKeySaveOnHistoryDetailTab = true;
            break;
        }
      }
    });
  }

  initSelectedPlans() {
    (<FormArray>this.patientDetailFormGroup.get('selectedPlans')).push(
      this.fb.group({
        medicalCoverageId: '',
        planId: '',
        patientCoverageId: '',
        coverageType: '',
        isNew: false,
        startDate: '',
        endDate: '',
        remarks: '',
        costCenter: '',
        coverageSelected: this.fb.group(new MedicalCoverageSelected()),
        planSelected: this.fb.group(new CoverageSelected())
      })
    );
  }

  getAlerts() {
    this.apiPatientInfoService.listAlert(this.store.getPatientId()).subscribe(
      res => {
        if (res.payload) {
          const tempAlerts = res.payload.details;
          tempAlerts.forEach(alerts => {
            if (
              this.medicalAlertTypes.find(function (x) {
                return x.value === alerts.alertType;
              })
            ) {
              this.medicalAlerts.push(alerts);
            }
          });
        }
      },
      error => { }
    );
  }

  showAddConfirmation() {
    this.apiPatientVisitService.getPatientVisitHistory(this.store.getPatientId()).subscribe(
      res => {
        const outstandingPayment = res.payload
          .map(history => history.billPayment || { paymentStatus: '' })
          .filter(payment => payment.paymentStatus === 'PENDING_PAYMENT_CONFIRMATION');
        if (outstandingPayment.length > 0) {
          alert('This patient has outstanding payment.');
        }

        // this.currPatientId = patientId;
        const initialState = {
          title: 'Confirmation of Patient Visit',
          selectedCoverages: this.fb.array([])
        };

        this.confirmationBsModalRef = this.modalService.show(PatientAddQueueConfirmationComponent, {
          initialState,
          class: 'modal-lg'
        });

        this.confirmationBsModalRef.content.event.subscribe(data => {
          if (data) {
            console.log('Patient Search Data', data);
            this.addPatientToRegistry(this.store.getPatientId(), data);
          } else {
            console.log('No data emitted');
          }
          this.confirmationBsModalRef.content.event.unsubscribe();
          this.confirmationBsModalRef.hide();
        });
      },
      err => this.alertService.error(JSON.stringify(err.error['message']))
    );
  }

  // Fire initCreatAPI
  addPatientToRegistry(patientId: string, data) {
    const medCoverage: AttachedMedicalCoverage[] = [
      {
        medicalCoverageId: '0',
        planId: '0'
      }
    ];

    const visitPurpose: VisitPurpose = {
      name: data.purposeOfVisit,
      consultationRequired: true
    };

    const patientRegistryEntry: PatientVisit = {
      patientId: patientId, // "5a61bb4edbea1b292faff7df",
      clinicId: this.store.getClinicId(),
      attachedMedicalCoverages: data.attachedMedicalCoverages,
      remark: data.remarks,
      visitPurpose: visitPurpose,
      preferredDoctorId: data.preferredDoctor
    };

    console.log('patient to be added to registry', patientRegistryEntry);
    this.apiPatientVisitService.initCreate(patientRegistryEntry).subscribe(
      res => {
        console.log('Added patient into registry');
        if (res) {
          console.log(res);
          this.router.navigate(['patient']);
        }
      },
      err => this.alertService.error(JSON.stringify(err))
    );
  }

  createCoverageSelectedFB(address, contacts, policyHolder): FormGroup {
    const p = policyHolder;
    const formGroup = this.fb.group({
      address: address,
      contacts: this.medicalCoverageFormService.createContacts(contacts),
      costCenter: p.costCenter,
      id: p.id,
      identificationNumber: this.fb.group({
        idType: p.identificationNumber.idType,
        number: p.identificationNumber.number
      }),
      medicalCoverageId: p.medicalCoverageId,
      name: p.name,
      patientCoverageId: p.patientCoverageId,
      planId: p.planId,
      specialRemarks: p.specialRemarks,
      startDate: p.startDate,
      status: p.status
    });

    return formGroup;
  }

  populateData(payload: MedicalCoverageResponse) {
    console.log('PAYLOAD: ', payload);

    for (const key of Object.keys(payload)) {
      if (payload[key].length > 0) {
        payload[key].forEach(element => {
          const policyHolder = element.policyHolder;

          this.policyHolderInfo.push(this.medicalCoverageFormService.createCoverageSelectedFB(policyHolder));

          const medicalCoverageSelected =
            this.store.getPlansByCoverageId(element.policyHolder.medicalCoverageId).length === 0
              ? new MedicalCoverageSelected()
              : <MedicalCoverageSelected>this.store.getPlansByCoverageId(element.policyHolder.medicalCoverageId);
          const plan = new SelectedPlan(
            false,
            policyHolder.medicalCoverageId,
            policyHolder.patientCoverageId,
            '',
            policyHolder.planId,
            medicalCoverageSelected,
            element.coveragePlan,
            policyHolder.costCenter,
            key,
            policyHolder.startDate,
            policyHolder.endDate,
            false,
            policyHolder.specialRemarks
          );

          (<FormArray>this.patientDetailFormGroup.get('selectedPlans')).push(this.fb.group(plan));
        });
      }
    }
    console.log('policy-holder-info: ', this.policyHolderInfo);
    return this.patientDetailFormGroup.get('selectedPlans').value;
  }

  // Action
  onBtnBackClicked() {
    this.location.back();
  }

  onBtnAddToRegistryClicked() {
    const initialState = {
      title: 'Confirmation of Patient Update',
      selectedPlans: this.plans
    };

    this.confirmationBsModalRef = this.modalService.show(PatientUpdateConfirmationComponent, {
      initialState,
      class: 'modal-lg'
    });

    this.confirmationBsModalRef.content.event.subscribe(data => {
      this.confirmationBsModalRef.content.event.unsubscribe();
      this.confirmationBsModalRef.hide();

      // this.updatePatient();
      this.assignPolicy();
    });
  }

  onBtnSaveClicked() {
    // alert("Patient's details has been updated.");
    // UPDATE ANY NEW CHANGES TO MEDICAL COVERAGE END OR STATUS

    this.updatePatient();
    // this.assignPolicy();
  }

  assignPolicy() {
    const newPolicyHolders = [];
    const newPolicyTypes = [];

    const currentPolicyHolders = [];
    const currentPolicyTypes = [];
    // this.selectedCoverageType = new Set();
    const plans = this.patientDetailFormGroup.get('selectedPlans').value;
    // let hasError = false;

    if (plans.length < 1) {
      this.endUpdating();
      return;
    }

    // if (plans.length > 0) {
    plans.forEach((plan, index) => {
      console.log('plan: ', plan);
      if (plan.isNew) {
        console.log('PLAN IS NEW!');

        const holderDetails = {
          identificationNumber: {
            idType: this.patientInfo.userId.idType,
            number: this.patientInfo.userId.number
          },
          name: this.patientInfo.name,
          medicalCoverageId: plan.medicalCoverageId,
          planId: plan.planId,
          patientCoverageId: plan.patientCoverageId,
          specialRemarks: plan.remarks,
          status: 'ACTIVE',
          startDate: plan.startDate,
          endDate: plan.endDate,
          costCenter: plan.costCenter
        };
        const policyType = plan.coverageType;

        newPolicyHolders.push(holderDetails);
        newPolicyTypes.push(policyType);
      } else {
        const today = moment().format(DISPLAY_DATE_FORMAT);
        const endDate = plan.coverageSelected.endDate;

        const policyExpired = !moment(today, DISPLAY_DATE_FORMAT).isSameOrBefore(moment(endDate, DISPLAY_DATE_FORMAT));
        // UPDATE POLICY HERE
        // if( moment(policyEndDate, DISPLAY_DATE_FORMAT).isSameOrBefore(moment(today, DISPLAY_DATE_FORMAT))
        // {
        if (!policyExpired) {
          const holderDetails = {
            id: this.policyHolderInfo.value[index].id,
            identificationNumber: {
              idType: this.patientInfo.userId.idType,
              number: this.patientInfo.userId.number
            },
            name: this.patientInfo.name,
            medicalCoverageId: plan.medicalCoverageId,
            planId: plan.planId,
            patientCoverageId: plan.patientCoverageId,
            specialRemarks: plan.remarks,
            status: this.policyHolderInfo.value[index].status,
            startDate: plan.startDate,
            endDate: plan.endDate,
            costCenter: plan.costCenter
          };
          const policyType = plan.coverageType;

          currentPolicyHolders.push(holderDetails);
          currentPolicyTypes.push(policyType);
        }
        // }
        console.log('CURRENT POLICY HOLDERS: ', currentPolicyHolders);
      }
      this.selectedCoverageType.add(plan.coverageType);
    });

    // if (!hasError) {
    // Skip updating policy when nothing new, and update patient instead
    if (newPolicyHolders.length < 1 && currentPolicyHolders.length < 1) {
      this.endUpdating();
      return;
    }

    forkJoin(
      currentPolicyHolders.map((plan, index) =>
        this.apiPatientInfoService.editPolicy(
          currentPolicyTypes[index],
          currentPolicyHolders[index].id,
          currentPolicyHolders[index]
        )
      )
    ).subscribe(
      arr => {
        console.log('updated policy holders');
        this.endUpdating();
      },
      err => this.alertService.error(JSON.stringify(err.error['message']))
    );

    forkJoin(
      newPolicyHolders.map((plan, index) =>
        this.apiPatientInfoService.assignPolicy(newPolicyTypes[index], newPolicyHolders[index])
      )
    ).subscribe(
      arr => {
        //this.addPatientToRegistry();
        this.endUpdating();
        // this.router.navigate(['patient']);
      },
      err => this.alertService.error(JSON.stringify(err.error['message']))
    );
  }

  endUpdating() {
    alert("Patient's details has been updated.");
    this.router.navigate(['patient']);
  }

  enforcePolicy(plans) { }

  onKeyUp(event: KeyboardEvent) {
    if (event.code === '0x003E') {
      this.onBtnSaveClicked();
    }
  }

  // Main
  updateFormGroup() {
    const patientInfo = this.patientInfo;
    const alertArray = this.patientDetailFormGroup.get('alertFormGroup').get('alertArray') as FormArray;
    const medicalAlertArray = this.patientDetailFormGroup.get('medicalAlertFormGroup').get('alertArray') as FormArray;

    this.patientDetailFormGroup.get('headerFormGroup').patchValue({
      name: patientInfo.name
    });
    this.patientDetailFormGroup.get('alertFormGroup').patchValue({
      state: ''
    });
    this.patientDetailFormGroup.get('medicalAlertFormGroup').patchValue({
      state: ''
    });

    patientInfo.allergies.forEach(allergy => {
      alertArray.push(this.formatAlertArrayItem(allergy));
    });

    this.medicalAlerts.forEach(alert => {
      medicalAlertArray.push(this.formatMedicalAlertArrayItem(alert));
    });

    // const birth = patientInfo.dob.split('-');
    const birth = patientInfo.dob ? moment(patientInfo.dob, DISPLAY_DATE_FORMAT).toDate() : '';
    console.log('BIRTHDAY', birth);
    this.patientDetailFormGroup.get('basicInfoFormGroup').patchValue({
      title: patientInfo.title,
      name: patientInfo.name,
      //birth: new Date(parseInt(birth[2]), parseInt(birth[1]) - 1, parseInt(birth[0])),
      birth,
      gender: patientInfo.gender,
      // id: patientInfo.userId.number,
      // idType: patientInfo.userId.idType,
      country: patientInfo.address.country,
      race: patientInfo.race,
      nationality: patientInfo.nationality,
      status: patientInfo.maritalStatus,
      language: patientInfo.preferredLanguage
    });

    // this.patientDetailFormGroup
    //   .get('basicInfoFormGroup')
    //   .get('fullId')
    //   .get('idType')
    //   .updateValueAndValidity();
    // this.patientDetailFormGroup
    //   .get('basicInfoFormGroup')
    //   .get('fullId')
    //   .get('id')
    //   .updateValueAndValidity();

    // this.patientDetailFormGroup
    //   .get('basicInfoFormGroup')
    //   .get('fullId')
    //   .get('id')
    //   .updateValueAndValidity();

    this.patientDetailFormGroup
      .get('basicInfoFormGroup')
      .get('fullId')
      .patchValue({
        id: patientInfo.userId.number,
        idType: patientInfo.userId.idType
        // selectedCountry: patientInfo.address.country
      });

    this.storedPatientID = patientInfo.userId.number;
    this.storedPatientIDType = patientInfo.userId.idType;

    // this.patientDetailFormGroup
    //   .get('basicInfoFormGroup')
    //   .get('fullId')
    //   .get('idType')
    //   .updateValueAndValidity();
    // this.patientDetailFormGroup
    //   .get('basicInfoFormGroup')
    //   .get('fullId')
    //   .get('id')
    //   .updateValueAndValidity();
    // this.patientDetailFormGroup.updateValueAndValidity();

    this.patientDetailFormGroup.get('contactDetailFormGroup').patchValue({
      primary: patientInfo.contactNumber.number
        ? this.utilsService.formatToE164PhoneNumber(patientInfo.contactNumber.number)
        : '',
      // secondary: `+${patientInfo.contactNumber.countryCode} 23456789`,
      secondary: patientInfo.secondaryNumber ? this.utilsService.formatToE164PhoneNumber(patientInfo.secondaryNumber.number)
        : '',

      line1: patientInfo.address.address ? patientInfo.address.address.split('\n')[0] : '',
      line2: patientInfo.address.address
        ? patientInfo.address.address.split('\n')[1] !== 'undefined'
          ? patientInfo.address.address.split('\n')[1]
          : ''
        : '',
      postCode: patientInfo.address.postalCode,
      email: patientInfo.emailAddress,
      communicationMode: patientInfo.preferredMethodOfCommunication,
      consent: patientInfo.consentGiven
    });

    this.patientDetailFormGroup.get('companyInfoFormGroup').patchValue({
      company: patientInfo.company ? patientInfo.company.name : '',
      occupation: patientInfo.company ? patientInfo.company.occupation : '',
      line1: patientInfo.company.address ? patientInfo.company.address.split('\n')[0] : '',
      line2: patientInfo.company.address ? patientInfo.company.address.split('\n')[1] : '',
      postCode: patientInfo.company ? patientInfo.company.postalCode : ''
    });

    if (
      patientInfo.emergencyContactNumber &&
      patientInfo.emergencyContactNumber.relationship &&
      patientInfo.emergencyContactNumber.relationship !== ''
    ) {
      this.patientDetailFormGroup.get('emergencyContactFormGroup').patchValue({
        name: patientInfo.emergencyContactNumber.name,
        contact: patientInfo.emergencyContactNumber.number,
        relationship: patientInfo.emergencyContactNumber.relationship
      });
    } else {
      this.patientDetailFormGroup.get('emergencyContactFormGroup').patchValue({});
    }

    const startDate = moment()
      .subtract(6, 'months')
      .format(DISPLAY_DATE_FORMAT);
    const endDate = moment().format(DISPLAY_DATE_FORMAT);
    this.apiPatientVisitService.listAllFiles(this.store.getPatientId(), startDate, endDate).subscribe(
      res => {
        const payload = res.payload;
        const flattenPayload = payload.reduce((documents, documentGroup) => {
          documentGroup.fileMetaData.forEach(file => {
            file.localDate = documentGroup.localDate;
            file.listType = documentGroup.listType;
            file.patientVisitId = documentGroup.patientVisitId || '';
          });
          documents = documents.concat(documentGroup.fileMetaData);
          return documents;
        }, []);
        const allDocuments = flattenPayload.reduce((allDocuments, documents) => allDocuments.concat(documents), []);
        this.patientDocuments = allDocuments;
        this.updateDocumentList('patient');
      },
      err => this.alertService.error(JSON.stringify(err))
    );

    this.patientDetailFormGroup.get('historyFilterFormGroup').patchValue({
      doctors: {
        value: this.store.getDoctorList().map(doctor => {
          return { value: doctor.id, label: doctor.name };
        })
      }
    });

    this.patientDetailFormGroup.patchValue({ needRefresh: false });
    this.patientService.setPatientDetailFormGroup(this.patientDetailFormGroup);
  }

  subscribeValueChanges() {
    console.log('Patient Detail Form ', this.patientDetailFormGroup.controls);
    const patientInfo = this.patientInfo;
    const alertFormGroup = this.patientDetailFormGroup.get('alertFormGroup');
    const medicalAlertFormGroup = this.patientDetailFormGroup.get('medicalAlertFormGroup');
    const alertArray = alertFormGroup.get('alertArray') as FormArray;
    const medicalAlertArray = medicalAlertFormGroup.get('alertArray') as FormArray;
    const fullIdArrayFormGroup = this.patientDetailFormGroup.get('basicInfoFormGroup').get('fullId');

    alertFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        if (values.isAdd) {
          alertFormGroup.patchValue({
            isAdd: false
          });
          alertArray.push(this.newAlertArrayItem());
        }
      });

    medicalAlertFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged())
      .subscribe(values => {
        console.log('ENTERED HERE');
        if (values.isAdd) {
          medicalAlertFormGroup.patchValue({
            isAdd: false
          });
          medicalAlertArray.push(this.newMedicalAlertArrayItem());
        }
      });

    fullIdArrayFormGroup.valueChanges
      .pipe(filter(val => {
        // Filter and remove '/'
        if (val.id.match(/[^a-zA-Z0-9 ]/g)) {
          val.id = val.id.replace(/[^a-zA-Z0-9 ]/g, '');
          fullIdArrayFormGroup.get('id').setValue(val.id);
        }
        return val;
      }),
      debounceTime(500),
      map(val => {
        fullIdArrayFormGroup.get('id').markAsTouched();

        if (
          !(
            val.id.toUpperCase() === this.storedPatientID.toUpperCase() &&
            val.idType.toUpperCase() === this.storedPatientIDType.toUpperCase()
          )
        ) {
          // if (val.id || val.idType) {
          console.log('val.idType.toUpperCase(): ', val.idType.toUpperCase());
          console.log('setting validators');
          fullIdArrayFormGroup
            .get('id')
            .setAsyncValidators([
              this.patientService.checkWhetherUserExists(
                this.apiPatientInfoService,
                fullIdArrayFormGroup.get('idType'),
                'idType'
              ),
              this.patientService.validateIdentification(
                this.apiCmsManagementService,
                fullIdArrayFormGroup.get('idType'),
                'idType'
              )
            ]);
          console.log('finish setting validators');
        }

        if (
          (val.id.toUpperCase() === this.storedPatientID.toUpperCase() &&
            val.idType.toUpperCase() === 'NRIC_PINK' &&
            this.storedPatientIDType.toUpperCase() === 'NRIC_BLUE') ||
          (val.id.toUpperCase() === this.storedPatientID.toUpperCase() &&
            val.idType.toUpperCase() === 'NRIC_BLUE' &&
            this.storedPatientIDType.toUpperCase() === 'NRIC_PINK')
        ) {
          fullIdArrayFormGroup
            .get('id')
            .setAsyncValidators([
              this.patientService.checkWhetherUserExists(
                this.apiPatientInfoService,
                fullIdArrayFormGroup.get('idType'),
                'idType'
              ),
              this.patientService.validateIdentification(
                this.apiCmsManagementService,
                fullIdArrayFormGroup.get('idType'),
                'idType'
              )
            ]);
        }

        val.id = val.id.toUpperCase();
        fullIdArrayFormGroup.patchValue(val);
        return val;
      }), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        fullIdArrayFormGroup.get('id').clearAsyncValidators();
        patientInfo.userId.number = values.id;
        patientInfo.userId.idType = values.idType;

        const countryFC = this.patientDetailFormGroup.get('basicInfoFormGroup').get('country');

        if (values.idType === 'PASSPORT') {
          if (countryFC.value === 'SINGAPORE') {
            //By default, country is set to Singapore, clear country when passport is selected
            // countryFC.reset();
            countryFC.setValidators(Validators.required);
            countryFC.markAsTouched();
            countryFC.updateValueAndValidity();
          }
        } else {
          countryFC.patchValue('SINGAPORE');
          countryFC.clearValidators();
          countryFC.updateValueAndValidity();
        }
      });

    this.patientDetailFormGroup
      .get('basicInfoFormGroup')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        patientInfo.title = values.title;
        patientInfo.name = values.name;
        patientInfo.dob = moment(values.birth).format(DISPLAY_DATE_FORMAT);
        patientInfo.gender = values.gender;
        patientInfo.nationality = values.nationality;
        patientInfo.maritalStatus = values.status;
        patientInfo.address.country = values.country;
        patientInfo.race = values.race;
        patientInfo.preferredLanguage = values.language;
      });

    this.patientDetailFormGroup
      .get('contactDetailFormGroup')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        // const contact = values.primary.split(' ');
        // patientInfo.contactNumber.countryCode = contact[0];
        // patientInfo.contactNumber.number = contact[1];
        console.log("values secondary: ", values);
        const emailControlForm = this.patientDetailFormGroup.get('contactDetailFormGroup').get('email');
        patientInfo.contactNumber.number = values.primary;

        if (patientInfo.secondaryNumber) {
          patientInfo.secondaryNumber.number = values.secondary;
        } else {
          const secondaryNumber = { number: values.secondary };
          patientInfo['secondaryNumber'] = secondaryNumber;
        }
        console.log("PATIENT INFO HERE: ", this.patientInfo);

        // patientInfo.address.address = values.line1 + (values.line1.endsWith('\n') ? '' : '\n') + values.line2;
        patientInfo.address.postalCode = values.postCode;
        patientInfo.emailAddress = values.email;
        patientInfo.preferredMethodOfCommunication = values.communicationMode;
        patientInfo.consentGiven = values.consent;

        if (values.postCode) {
          this.patientDetailFormGroup
            .get('contactDetailFormGroup')
            .get('postCode')
            .setAsyncValidators(
              this.patientService.findAddress(
                this.apiCmsManagementService,
                this.patientDetailFormGroup.get('contactDetailFormGroup').get('postCode'),
                this.patientDetailFormGroup.get('contactDetailFormGroup').get('line1'),
                this.patientDetailFormGroup.get('contactDetailFormGroup').get('line2'),
                <FormGroup>this.patientDetailFormGroup.get('contactDetailFormGroup')
              )
            );

          patientInfo.address.address = values.line1 + (values.line1.endsWith('\n') ? '' : '\n') + values.line2;
        } else {
          this.patientDetailFormGroup
            .get('contactDetailFormGroup')
            .get('postCode')
            .clearAsyncValidators();

          patientInfo.address.address = values.line1 + (values.line1.endsWith('\n') ? '' : '\n') + values.line2;
        }
      });
    this.patientDetailFormGroup
      .get('companyInfoFormGroup')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        patientInfo.company.name = values.company;
        patientInfo.company.occupation = values.occupation;
        patientInfo.company.postalCode = values.postCode;

        if (values.postCode) {
          this.patientDetailFormGroup
            .get('companyInfoFormGroup')
            .get('postCode')
            .setAsyncValidators(
              this.patientService.findAddress(
                this.apiCmsManagementService,
                this.patientDetailFormGroup.get('companyInfoFormGroup').get('postCode'),
                this.patientDetailFormGroup.get('companyInfoFormGroup').get('line1'),
                this.patientDetailFormGroup.get('companyInfoFormGroup').get('line2'),
                <FormGroup>this.patientDetailFormGroup.get('companyInfoFormGroup')
              )
            );

          patientInfo.company.address = values.line1 + (values.line1.endsWith('\n') ? '' : '\n') + values.line2;
        } else {
          this.patientDetailFormGroup
            .get('companyInfoFormGroup')
            .get('postCode')
            .clearAsyncValidators();

          patientInfo.company.address = values.line1 + (values.line1.endsWith('\n') ? '' : '\n') + values.line2;
        }
      });
    this.patientDetailFormGroup
      .get('emergencyContactFormGroup')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        if (!patientInfo.emergencyContactNumber) {
          const emergencyContactNumber = { name: '', contact: '', relationship: '' };
          patientInfo.emergencyContactNumber = emergencyContactNumber;
        }

        patientInfo.emergencyContactNumber.name = values.name;
        patientInfo.emergencyContactNumber.number = values.contact;
        patientInfo.emergencyContactNumber.relationship = values.relationship ? values.relationship : null;

        // const contact = values.contact.split(' ');
        // patientInfo.emergencyContactNumber.countryCode = contact[0];
        // patientInfo.emergencyContactNumber.number = contact[1];
      });
    this.patientDetailFormGroup
      .get('documentsFormGroup')
      .get('filter')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.updateDocumentList('patient'));
    this.patientDetailFormGroup
      .get('documentsFormGroup')
      .get('dateRange')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        const startDate = moment(values[0]).format(DISPLAY_DATE_FORMAT);
        const endDate = moment(values[1]).format(DISPLAY_DATE_FORMAT);
        this.apiPatientVisitService.listAllFiles(this.store.getPatientId(), startDate, endDate).subscribe(
          res => {
            const payload = res.payload;
            const flattenPayload = payload.reduce((documents, documentGroup) => {
              documentGroup.fileMetaData.forEach(file => {
                file.localDate = documentGroup.localDate;
                file.listType = documentGroup.listType;
              });
              documents = documents.concat(documentGroup.fileMetaData);
              return documents;
            }, []);
            const allDocuments = flattenPayload.reduce((allDocuments, documents) => allDocuments.concat(documents), []);
            this.patientDocuments = allDocuments;
            this.updateDocumentList('patient');
          },
          err => this.alertService.error(JSON.stringify(err))
        );
      });
    this.patientDetailFormGroup
      .get('medicalCoverageFormGroup')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => a === b))
      .subscribe(values => {
        this.selectedMedicalCoverage = values.selectedPlans;
        this.createMedicalCoverages(this.selectedMedicalCoverage);
      });
    this.patientDetailFormGroup
      .get('historyFilterFormGroup')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        this.updateHistoryList();
      });
    this.patientDetailFormGroup.valueChanges
      .pipe(distinctUntilChanged((a, b) => a.historyDetailIndex === b.historyDetailIndex))
      .subscribe(values => {
        if (!values.isHistoryList && values.historyDetailIndex !== -1) {
          this.clearHistoryDetailFormGroupArrays();

          const historyArray = this.patientDetailFormGroup.get('historyListFormGroup').get('formArray') as FormArray;
          const history = this.histories[values.historyDetailIndex];
          console.log('HISTORY', history);
          this.store.setPatientVisitRegistryId(history.patientVisitId);

          if (!history.consultation) {
            return;
          }

          const historyDetailFormGroup = this.patientDetailFormGroup.get('historyDetailFormGroup');
          const diagnosisArray = historyDetailFormGroup.get('diagnosisArray') as FormArray;
          const serviceArray = historyDetailFormGroup.get('serviceArray') as FormArray;
          const drugArray = historyDetailFormGroup.get('drugArray') as FormArray;
          const documentsArray = historyDetailFormGroup.get('documentsArray') as FormArray;
          const testArray = historyDetailFormGroup.get('testArray') as FormArray;
          const vaccineArray = historyDetailFormGroup.get('vaccineArray') as FormArray;
          const certificateArray = historyDetailFormGroup.get('certificateArray') as FormArray;

          this.patientDetailFormGroup.patchValue({
            historyDetailFormGroup: {
              ...historyArray.at(values.historyDetailIndex).value,
              patientInfo,
              consultationInfo: history.consultation,
              paymentInfo: history.billPayment,
              doctorId: history.consultation.doctorId,
              purpose: history.visitPurpose ? history.visitPurpose.name : '',
              notes: history.consultation.consultationNotes || '',
              startTime: history.startTime ? moment(history.startTime, 'DD-MM-YYYYTHH:mm:ss').format('HH:mm') : '-',
              endTime: history.endTime ? moment(history.endTime, 'DD-MM-YYYYTHH:mm:ss').format('HH:mm') : '-',
              timeChitFrom: (history.visitTimeChit && history.visitTimeChit.from)
                ? moment(history.visitTimeChit.from, 'DD-MM-YYYYTHH:mm:ss').format('HH:mm')
                : '',
              timeChitTo: (history.visitTimeChit && history.visitTimeChit.to)
                ? moment(history.visitTimeChit.to, 'DD-MM-YYYYTHH:mm:ss').format('HH:mm')
                : '',
              ...this.getPriceFromPaymentInfo(
                history.billPayment || {
                  drugs: [],
                  medicalServices: [],
                  medicalTests: [],
                  vaccinations: []
                }
              ),
              followupConsultationFormGroup: {
                id: '',
                patientId: '',
                patientVisitId: '',
                followupDate: '',
                remarks: ''
              }
            }
          });

          if (history.consultation.followupConsultation) {
            this.patientDetailFormGroup.patchValue({
              historyDetailFormGroup: {
                followupConsultationFormGroup: history.consultation.followupConsultation
              }
            });
          }

          if (history.consultation.patientReferral) {
            let doctor;
            let clinic;
            let str = '';

            const patientReferrals = history.consultation.patientReferral.patientReferrals;
            patientReferrals.map(element => {
              element.appointmentDateTime = element.appointmentDateTime ? element.appointmentDateTime : '';
              element.clinicId = element.clinicId ? element.clinicId : '';
              element.doctorId = element.doctorId ? element.doctorId : '';
              element.externalReferral = element.externalReferral ? element.externalReferral : false;
              element.memo = element.memo ? element.memo : '';
              element.practice = element.practice ? element.practice : '';

              element.externalReferralDetails = element.externalReferralDetails
                ? element.externalReferralDetails
                : { address: '', doctorName: '', phoneNumber: '' };

              doctor = this.store.getDoctorList().find(doctor => doctor.id === element.doctorId);
              if (!doctor) {
                doctor = { name: '' };
              }
              clinic = this.store.getClinicList().find(clinic => clinic.id === element.clinicId);
              if (!clinic) {
                clinic = new ClinicOnly();
              }

              const appointmentDateTime = element.appointmentDateTime ? element.appointmentDateTime : '';
              const clinicId = element.clinicId ? element.clinicId : '';
              const doctorId = element.doctorId ? element.doctorId : '';
              const externalReferral = element.externalReferral ? element.externalReferral : '';
              const memo = element.memo ? element.memo : '';
              const practice = element.practice ? element.practice : '';

              const address = element.externalReferralDetails.address ? element.externalReferralDetails.address : '';
              const doctorName = element.externalReferralDetails.doctorName
                ? element.externalReferralDetails.doctorName
                : '';
              const phoneNumber = element.externalReferralDetails.phoneNumber
                ? element.externalReferralDetails.phoneNumber
                : '';

              const externalReferralDetails = this.fb.group({
                address: address,
                doctorName: doctorName,
                phoneNumber: phoneNumber
              });

              element.externalReferralDetails = element.externalReferralDetails
                ? element.externalReferralDetails
                : externalReferralDetails;

              if (!element.externalReferral) {
                str = element.memo
                  ? `Referral letter to ${doctor.name} (${clinic.name}@${clinic.address.address || ''} Singapore ${
                  clinic.address.postalCode
                  })`
                  : '';
                element.str = str;
              } else {
                str = element.memo
                  ? `Referral letter to ${element.externalReferralDetails.doctorName} (${
                  element.externalReferralDetails.address
                  })`
                  : '';
                element.str = str;
              }

              const referralObj = this.fb.group({
                appointmentDateTime: appointmentDateTime,
                clinicId: clinicId,
                doctorId: doctorId,
                externalReferral: externalReferral,
                memo: memo,
                practice: practice,
                externalReferralDetails: externalReferralDetails,
                str
              });
            });
            const referralArray = historyDetailFormGroup.get('referralArray') as FormArray;
            patientReferrals.forEach(referralObj => {
              referralArray.push(this.fb.group(referralObj));
            });
          }

          const diagnosis = history.diagnoses;
          diagnosis.forEach(diagnosisItem => {
            diagnosisArray.push(
              this.fb.group({
                icd: diagnosisItem.icd10Code,
                description: diagnosisItem.icd10Term
              })
            );
          });

          const services = history.consultation.medicalServiceGiven.medicalServices;
          services.forEach(service => {
            const detail = this.store.getMedicalServiceList().find(detail => detail.id === service.serviceId);
            const itemDetail = detail.medicalServiceItemList.find(
              itemDetail => itemDetail.id === service.serviceItemId
            ) || { name: '' };
            const bill = history.billPayment
              ? history.billPayment.medicalServices.find(item => item.itemId === service.serviceItemId)
              : { charge: { price: 0 }, quantity: 0 };
            const unitPrice = bill.charge.price;
            const discount = this.convertDiscountGiven(
              unitPrice,
              bill.discountGiven || {
                decreaseValue: 0,
                increaseValue: 0,
                paymentType: 'DOLLAR'
              }
            );
            const adjPrice = discount.increase ? unitPrice + discount.value : unitPrice - discount.value;
            serviceArray.push(
              this.fb.group({
                category: detail.name,
                serviceName: itemDetail.name,
                price: unitPrice,
                discount:
                  discount.paymentType === 'DOLLAR'
                    ? discount.increase
                      ? discount.value
                      : '(' + discount.value + ')'
                    : discount.increase
                      ? discount.percentage + '%'
                      : '(' + discount.percentage + '%)',
                adjPrice
              })
            );
          });

          const drugs = history.consultation.drugDispatch.dispatchDrugDetail;
          drugs.forEach(drug => {
            const detail = this.store.getDrugList().find(detail => detail.id === drug.drugId);
            const bill = history.billPayment
              ? history.billPayment.drugs.find(item => item.itemId === drug.drugId)
              : { charge: { price: 0 }, quantity: 0 };
            const unitPrice = bill.charge.price;
            const discount = this.convertDiscountGiven(
              unitPrice,
              bill.discountGiven || {
                decreaseValue: 0,
                increaseValue: 0,
                paymentType: 'DOLLAR'
              }
            );
            const adjPrice = discount.increase
              ? (unitPrice + discount.value) * bill.quantity
              : (unitPrice - discount.value) * bill.quantity;

            // Get Drug Detail From Store
            const drugItem: DrugItem = this.store.findDrugById(drug.drugId);
            let drugCautionary = '';
            console.log('drug cautionary', drugItem);
            if (drugItem) {
              drugItem.cautionary.forEach(element => {
                drugCautionary += element + ' ';
              });
            } else {
              drugCautionary = drug.instruction.cautionary ? drug.instruction.cautionary : '';
            }

            const dosage = drug.dosageInstruction
              ? drug.dosageInstruction.instruct.replace('#', drug.dose.quantity)
              : `${drug.dose.quantity} ${drug.dose.uom}`;
            drugArray.push(
              this.fb.group({
                drugCode: detail.code,
                dosage: dosage,
                instr: drug.instruction.instruct,
                duration: drug.duration,
                quantity: `${drug.quantity} ${drug.dose.uom}`,
                price: unitPrice * (bill.quantity || 0),
                discount:
                  discount.paymentType === 'DOLLAR'
                    ? discount.increase
                      ? discount.value * bill.quantity
                      : '(' + discount.value * bill.quantity + ')'
                    : discount.increase
                      ? discount.percentage + '%'
                      : '(' + discount.percentage + '%)',
                adjPrice,
                batchNo: drug.batchNumber,
                remarks: drug.remark,
                expiryDate: drug.expiryDate,
                isAllergic: false,

                drugName: detail.name,
                freqPerDay: drug.instruction.frequencyPerDay,
                cautionary: drugCautionary,
                instruction: drug.instruction.instruct
              })
            );
          });

          if (this.store.getPatientVisitRegistryId()) {
            this.apiPatientVisitService.listDocuments('VISIT', this.store.getPatientVisitRegistryId()).subscribe(
              res => {
                const documents = (this.visitDocuments = res.payload.visitDocuments);
                if (documents && documents.length) {
                  documents.forEach(document => {
                    documentsArray.push(
                      this.fb.group({
                        name: document.name,
                        document: document.fileName,
                        description: document.description,
                        type: document.type,
                        size: document.size,

                        fileId: document.fileId,
                        clinicId: document.clinicId
                      })
                    );
                  });
                  historyDetailFormGroup
                    .get('filter')
                    .valueChanges
                    .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
                    .subscribe(
                      res => {
                        this.updateDocumentList('visit');
                      },
                      err => this.alertService.error(JSON.stringify(err))
                    );
                }
              },
              err => this.alertService.error(JSON.stringify(err))
            );
          }

          const tests = history.consultation.issuedMedicalTest.issuedMedicalTestDetails;
          tests.forEach(test => {
            const detail = this.store.getMedicalTestList().find(detail => detail.id === test.testId);
            const bill = history.billPayment
              ? history.billPayment.medicalTests.find(item => item.itemId === test.testId)
              : { charge: { price: 0 }, quantity: 0 };
            const unitPrice = bill.charge.price;
            const discount = this.convertDiscountGiven(
              unitPrice,
              bill.discountGiven || {
                decreaseValue: 0,
                increaseValue: 0,
                paymentType: 'DOLLAR'
              }
            );
            const adjPrice = discount.increase ? unitPrice + discount.value : unitPrice - discount.value;
            testArray.push(
              this.fb.group({
                testCode: detail.code,
                category: detail.category,
                testName: detail.name,
                lab: test.suggestedLocation,
                price: unitPrice,
                discount:
                  discount.paymentType === 'DOLLAR'
                    ? discount.increase
                      ? discount.value
                      : '(' + discount.value + ')'
                    : discount.increase
                      ? discount.percentage + '%'
                      : '(' + discount.percentage + '%)',
                adjPrice
              })
            );
          });

          const vaccines = history.consultation.immunisationGiven.immunisation;
          vaccines.forEach(vaccine => {
            const detail = this.store.getVacinnationList().find(detail => detail.id === vaccine.vaccinationId);
            const itemDetail = detail.doses.find(itemDetail => itemDetail.doseId === vaccine.doseId) || { name: '' };
            const bill = history.billPayment
              ? history.billPayment.vaccinations.find(item => item.itemId === vaccine.doseId)
              : { charge: { price: 0 }, quantity: 0 };
            const unitPrice = bill.charge.price;
            const discount = this.convertDiscountGiven(
              unitPrice,
              bill.discountGiven || {
                decreaseValue: 0,
                increaseValue: 0,
                paymentType: 'DOLLAR'
              }
            );
            const adjPrice = discount.increase ? unitPrice + discount.value : unitPrice - discount.value;
            vaccineArray.push(
              this.fb.group({
                vaccine: detail.name,
                dosage: itemDetail.name,
                nextDose: vaccine.nextDose,
                price: unitPrice,
                discount:
                  discount.paymentType === 'DOLLAR'
                    ? discount.increase
                      ? discount.value
                      : '(' + discount.value + ')'
                    : discount.increase
                      ? discount.percentage + '%'
                      : '(' + discount.percentage + '%)',
                adjPrice,
                batchNo: vaccine.batchNumber,
                expiryDate: '',
                immunisationDate: vaccine.immunisationDate
              })
            );
          });

          this.patientDetailFormGroup.patchValue({
            historyDetailFormGroup: {
              clinicNotes: history.consultation.clinicNotes || '',
              memo: history.consultation.memo || ''
            }
          });

          const certificates = history.consultation.medicalCertificates;
          certificates.forEach(certificate => {
            const {
              purpose,
              startDate,
              numberOfDays,
              otherReason,
              referenceNumber,
              halfDayOption,
              remark
            } = certificate;

            const adjustedEndDate = numberOfDays - 1 >= 0 ? numberOfDays - 1 : 0;
            const endDate = moment(startDate, DISPLAY_DATE_FORMAT)
              .add(adjustedEndDate, 'days')
              .format(DISPLAY_DATE_FORMAT);
            certificateArray.push(
              this.fb.group({
                purpose,
                startDate,
                endDate,
                numberOfDays,
                referenceNumber,
                otherReason: otherReason || '',
                str: `${purpose} for ${numberOfDays} day(s) from ${startDate} to ${endDate}`,
                halfDayOption,
                remark: remark || ''
              })
            );
          });
        }
      });
  }

  initHistoryList() {
    if (!this.isHistoryListInit) {
      this.apiPatientVisitService.getPatientVisitHistory(this.store.getPatientId()).subscribe(
        res => {
          this.histories = res.payload
            .filter(history => Object.keys(history).length)
            .filter(history => history.consultation)
            .sort((a, b) => {
              const momentA = moment(a.consultation.consultationStartTime, DB_FULL_DATE_FORMAT);
              const momentB = moment(b.consultation.consultationStartTime, DB_FULL_DATE_FORMAT);
              return momentB.diff(momentA);
            });
          this.updateHistoryList();
          this.isHistoryListInit = true;
        },
        err => this.alertService.error(JSON.stringify(err))
      );
    }
  }

  updateDocumentList(type: string) {
    const formGroup =
      type === 'visit'
        ? this.patientDetailFormGroup.get('historyDetailFormGroup')
        : this.patientDetailFormGroup.get('documentsFormGroup');
    const documents =
      type === 'visit'
        ? this.visitDocuments.filter(document => document.name.includes(formGroup.get('filter').value))
        : this.patientDocuments.filter(document => document.fileName.includes(formGroup.get('filter').value));
    const documentsArray = formGroup.get('documentsArray') as FormArray;
    while (documentsArray.length) {
      documentsArray.removeAt(0);
    }
    documents.forEach(document => {
      documentsArray.push(
        this.fb.group({
          name: document.name || '',
          date: document.listType === 'VISIT' ? document.localDate || '' : '',
          document: document.fileName,
          description: document.description,
          type: document.type,
          size: document.size,
          listType: document.listType || '',
          patientVisitId: document.patientVisitId || '',

          fileId: document.fileId,
          clinicId: document.clinicId
        })
      );
    });
  }

  updateHistoryList() {
    const histories = this.histories;
    if (histories && histories.length) {
      const values = this.patientDetailFormGroup.get('historyFilterFormGroup').value;
      const historyArray = this.patientDetailFormGroup.get('historyListFormGroup').get('formArray') as FormArray;
      while (historyArray.length) {
        historyArray.removeAt(0);
      }
      histories.forEach(history => {
        if (!history.consultation) {
          return;
        }
        const startTime = moment(history.consultation.consultationStartTime, DB_FULL_DATE_FORMAT);
        if (moment(values.dateFrom).isAfter(startTime)) {
          return;
        }
        if (
          moment(values.dateTo)
            .add(1, 'days')
            .isBefore(startTime)
        ) {
          return;
        }
        if (values.doctor && values.doctor !== history.consultation.doctorId) {
          return;
        }
        const doctor = this.store.getDoctorList().find(doctor => doctor.id === history.consultation.doctorId);
        const clinic = this.store.getClinicList().find(clinic => clinic.id === history.consultation.clinicId);
        const charges = this.getPriceFromPaymentInfo(
          history.billPayment || {
            drugs: [],
            medicalServices: [],
            medicalTests: [],
            vaccinations: []
          }
        );
        const totalCharge = charges.overallCharges.value[0].charge;
        const totalGst = charges.overallCharges.value[0].gst;
        let outStanding = 0;
        let paid = 0;
        if (history.billPayment && history.billPayment.paymentStatus === 'PENDING_PAYMENT_CONFIRMATION') {
          outStanding = totalCharge + totalGst;
        } else if (history.billPayment && history.billPayment.paymentStatus === 'PAID') {
          paid = totalCharge + totalGst;
        }

        historyArray.push(
          this.fb.group({
            date: moment(history.consultation.consultationStartTime, DB_FULL_DATE_FORMAT).format(DISPLAY_DATE_FORMAT),
            diagnosis: {
              value: history.diagnoses.map(diagnosis => diagnosis.icd10Code)
            },
            doctor: doctor ? doctor.name : '',
            clinic: clinic ? clinic.name : '',
            amount: totalCharge + totalGst,
            billNo: history.billPayment ? history.billPayment.billNumber : '',
            consultationStartTime: history.consultation.consultationStartTime
              ? history.consultation.consultationStartTime
              : '2345',
            consultationEndTime: history.consultation.consultationEndTime
              ? history.consultation.consultationEndTime
              : '',
            status: {
              paid: paid,
              outstanding: outStanding
            }
          })
        );
      });
    }
  }

  clearHistoryDetailFormGroupArrays() {
    const historyDetailFormGroup = this.patientDetailFormGroup.get('historyDetailFormGroup');
    const arrayKeys = [
      'diagnosisArray',
      'serviceArray',
      'drugArray',
      'documentsArray',
      'testArray',
      'vaccineArray',
      'certificateArray',
      'referralArray'
    ];
    arrayKeys.forEach(key => {
      const array = historyDetailFormGroup.get(key) as FormArray;
      while (array.length) {
        array.removeAt(0);
      }
    });
  }

  // Utils
  pick(obj: Object, keys): Object {
    return Object.keys(obj)
      .filter(key => keys.includes(key))
      .reduce((pickedObj, key) => {
        pickedObj[key] = obj[key];
        return pickedObj;
      }, {});
  }

  updatePatient() {

    console.log('Patient Info', this.patientInfo);

    const keys = [
      'title',
      'preferredMethodOfCommunication',
      'consentGiven',
      'race',
      'preferredLanguage',
      'name',
      'dob',
      'userId',
      'gender',
      'contactNumber',
      'secondaryNumber',
      'status',
      'address',
      'emailAddress',
      'emergencyContactNumber',
      'company',
      'nationality',
      'maritalStatus',
      'allergies' // 'fileMetaData',
    ];
    const user = this.pick(this.patientInfo, keys);

    console.log('UPDATE USER', user);

    this.apiPatientInfoService.update(this.store.getPatientId(), user).subscribe(
      res => {
        // alert("Patient's details has been updated.");
        // this.router.navigate(['patient']);
        this.assignPolicy();
      },
      err => this.alertService.error(JSON.stringify(err))
    );
  }

  convertDiscountGiven(price: number, discountGiven) {
    let discount = 0;
    let percentage = 0;
    const increaseFlag = discountGiven.decreaseValue > 0 ? false : true;
    switch (discountGiven.paymentType) {
      case 'PERCENTAGE':
        discount =
          discountGiven.increaseValue > 0
            ? price * discountGiven.increaseValue / 100
            : price * discountGiven.decreaseValue / 100;
        percentage = discountGiven.increaseValue ? discountGiven.increaseValue : discountGiven.decreaseValue;
        break;
      case 'DOLLAR':
        discount = discountGiven.increaseValue > 0 ? discountGiven.increaseValue : discountGiven.decreaseValue;
        break;
      default:
        discount = discountGiven.increaseValue;
        break;
    }
    return { value: discount, paymentType: discountGiven.paymentType, increase: increaseFlag, percentage: percentage };
  }

  getPriceFromPaymentInfo(paymentInfo) {
    const overallCharges = [];
    const gstValue = paymentInfo.gstValue / 100 || 0.07;

    const invoice = paymentInfo;
    const totalAmount = invoice.totalBillAmount - invoice.includedTotalGstAmount || 0;
    const includedGstAmount = invoice.includedTotalGstAmount || 0;
    const creditPayments = invoice.creditPayments || [];
    const directPayments = invoice.directPayments || { amount: 0, totalGst: 0 };
    overallCharges.push({ paymentMode: 'Total Amount', charge: totalAmount, gst: includedGstAmount });
    creditPayments.forEach(creditPayment => {
      this.apiCmsManagementService.searchCoverage(creditPayment.medicalCoverageId).subscribe(res => {
        const coverage = res.payload.find(v => v.id === creditPayment.medicalCoverageId);
        const plan = coverage.coveragePlans.find(val => val.id === creditPayment.planId);
        const charges = {
          paymentMode: plan.name,
          charge: creditPayment.amount - creditPayment.totalGst,
          gst: creditPayment.totalGst
        };
        overallCharges.splice(overallCharges.length - 1, 0, charges);
      });
    });
    overallCharges.push({
      paymentMode: 'Cash',
      charge: directPayments.amount - directPayments.totalGst,
      gst: directPayments.totalGst
    });

    return { overallCharges: { value: overallCharges }, gstValue };
  }

  // Alert
  subscribeAlertArrayItemValueChanges(item: FormGroup, values) {
    if (values.isDelete) {
      this.patientInfo.allergies.splice(values.deleteIndex, 1);
      return;
    }

    const formArray = item.parent as FormArray;
    const index = formArray.value.map(values => JSON.stringify(values)).indexOf(JSON.stringify(values));
    const info = this.patientInfo.allergies[index];
    if (!info) {
      const updatedInfo = <any>{
        allergyType: values.type,
        name: values.name,
        remarks: values.remarks,
        addedDate: moment().format(DISPLAY_DATE_FORMAT)
      };
      this.patientInfo.allergies.push(updatedInfo);
    } else {
      info.allergyType = values.type;
      info.name = values.name;
      info.remarks = values.remarks;
    }
  }

  //Medical Alert
  subscribeMedicalArrayItemValueChanges(item: FormGroup, values) {
    const medicalAlertArray = this.patientDetailFormGroup.get('medicalAlertFormGroup').get('alertArray') as FormArray;

    if (values.isDelete) {
      this.medicalAlerts.splice(values.deleteIndex, 1);
      return;
    }

    if (values.alertId) {
      item.get('isEdit').patchValue(false);
    }

    const formArray = item.parent as FormArray;
    const index = formArray.value.map(arr => JSON.stringify(arr)).indexOf(JSON.stringify(values));
    const info = this.medicalAlerts[index];
    if (!info) {
      const updatedInfo = <any>{
        alertId: values.alertId,
        alertType: values.type,
        name: values.name,
        remark: values.remark,
        priority: values.priority,
        addedDate: values.addedDate,
        expiryDate: values.expiryDate
      };
      this.medicalAlerts.push(updatedInfo);
    } else {
      info.alertId = values.alertId;
      info.alertType = values.type;
      info.name = values.name;
      info.remark = values.remark;
      info.priority = values.priority;
      info.addedDate = values.addedDate;
      info.expiryDate = values.expiryDate;
    }
  }

  newAlertArrayItem() {
    const item = this.fb.group({
      types: { value: this.allergyTypes },
      type: ['', Validators.required],
      allergies: { value: this.allergyNames },
      name: ['', Validators.required],
      remarks: '',
      addedDate: moment().format(DISPLAY_DATE_FORMAT),

      isDelete: false,
      deleteIndex: -1
    });

    item.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.subscribeAlertArrayItemValueChanges(item, values));

    return item;
  }

  formatAlertArrayItem(allergy) {
    const item = this.fb.group({
      types: { value: this.allergyTypes },
      type: [allergy.allergyType, Validators.required],
      allergies: { value: this.allergyNames },
      name: [allergy.name, Validators.required],
      remarks: allergy.remarks,
      addedDate: allergy.addedDate,

      isDelete: false,
      deleteIndex: -1
    });

    item.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.subscribeAlertArrayItemValueChanges(item, values));

    return item;
  }

  newMedicalAlertArrayItem() {
    const item = this.fb.group({
      alertId: '',
      types: { value: this.medicalAlertTypes },
      type: '',
      name: ['', Validators.required],
      remark: '',
      priority: ['', Validators.required],
      priorityDropDown: { value: this.medicalAlertPriorities },
      isDelete: false,
      deleteIndex: -1,
      isEdit: true,
      addedDate: moment().format(DISPLAY_DATE_FORMAT),
      expiryDate: moment().format(DISPLAY_DATE_FORMAT)
    });

    item.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.subscribeMedicalArrayItemValueChanges(item, values));
    return item;
  }

  formatMedicalAlertArrayItem(medicalAlert) {
    const item = this.fb.group({
      alertId: medicalAlert.alertId,
      types: { value: ALERT_TYPES },
      type: medicalAlert.alertType,
      name: medicalAlert.name,
      remark: medicalAlert.remark,
      priority: medicalAlert.priority,
      priorityDropDown: { value: ALERT_PRIORITY },
      isDelete: false,
      deleteIndex: -1,
      isEdit: false,
      addedDate: medicalAlert.addedDate,
      expiryDate: medicalAlert.expiryDate
    });

    item.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.subscribeMedicalArrayItemValueChanges(item, values));

    return item;
  }

  // Medical Coverage
  createMedicalCoverages(values) {
    if (!values) {
      return;
    }

    const tempPlans: SelectedPlans[] = [];

    values.forEach((selectedItem, index) => {
      const capPerVisit: CapPerVisit = {
        visits: selectedItem.planSelected.capPerVisit['visits'],
        limit: selectedItem.planSelected.capPerVisit['limit']
      };

      const capPerWeek: CapPerVisit = {
        visits: selectedItem.planSelected.capPerWeek['visits'],
        limit: selectedItem.planSelected.capPerWeek['limit']
      };

      const capPerMonth: CapPerVisit = {
        visits: selectedItem.planSelected.capPerMonth.visits,
        limit: selectedItem.planSelected.capPerMonth.limit
      };

      const capPerYear: CapPerVisit = {
        visits: selectedItem.planSelected.capPerYear.visits,
        limit: selectedItem.planSelected.capPerYear.limit
      };

      const capPerLifeTime: CapPerVisit = {
        visits: selectedItem.planSelected.capPerLifeTime.visits,
        limit: selectedItem.planSelected.capPerLifeTime.limit
      };

      const copayment: Copayment = {
        value: selectedItem.planSelected.copayment.value,
        paymentType: selectedItem.planSelected.copayment.paymentType
      };

      const address: Address = {
        attentionTo: selectedItem.coverageSelected.address.attentionTo,
        street: selectedItem.coverageSelected.address.street,
        unit: selectedItem.coverageSelected.address.unit,
        postalCode: selectedItem.coverageSelected.address.postalCode
      };

      const coveragePlan: CoverageSelected = {
        id: '' + selectedItem.planSelected.id,
        name: '' + selectedItem.planSelected.name,
        capPerVisit: capPerVisit,
        capPerWeek: capPerWeek,
        capPerMonth: capPerMonth,
        capPerYear: capPerYear,
        capPerLifeTime: capPerLifeTime,
        copayment: copayment,
        limitResetType: '',
        code: '' + selectedItem.planSelected.code,
        remarks: 'testing',
        excludedClinics: [],
        includedMedicalServiceSchemes: [],
        excludedMedicalServiceSchemes: [],
        allowedRelationship: []
      };

      const contactArray = selectedItem.coverageSelected.contacts;
      const contactPersons: ContactPerson[] = [];
      contactArray.forEach(contact => {
        const contactPerson: ContactPerson = {
          name: contact.name,
          title: contact.title,
          directNumber: contact.directNumber,
          mobileNumber: contact.mobileNumber,
          faxNumber: contact.faxNumber,
          email: contact.email
        };

        contactPersons.push(contactPerson);
      });

      const medicalCoverage: MedicalCoverageSelected = {
        id: selectedItem.coverageSelected.id,
        name: selectedItem.coverageSelected.name,
        code: selectedItem.coverageSelected.code,
        accountManager: selectedItem.coverageSelected.accountManager,
        type: selectedItem.coverageSelected.type,
        startDate: selectedItem.coverageSelected.startDate,
        endDate: selectedItem.coverageSelected.endDate,
        creditTerms: selectedItem.coverageSelected.creditTerms,
        website: selectedItem.coverageSelected.website,
        trackAttendance: selectedItem.coverageSelected.trackAttendance,
        usePatientAddressForBilling: selectedItem.coverageSelected.usePatientAddressForBilling,
        medicineRefillAllowed: selectedItem.coverageSelected.medicineRefillAllowed,
        showDiscount: selectedItem.coverageSelected.showDiscount,
        showMemberCard: selectedItem.coverageSelected.showMemberCard,
        address: selectedItem.coverageSelected.address,
        contacts: contactPersons,
        coveragePlans: []
      };

      const temp: SelectedPlans = {
        isSelected: false,
        coverageSelected: medicalCoverage,
        employeeNo: selectedItem.employeeNo,
        planRows: '',
        planSelected: coveragePlan
      };

      tempPlans.push(temp);
    });

    this.plans = tempPlans;
  }
}
