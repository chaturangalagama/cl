import { UtilsService } from './../../../../services/utils.service';
import { MedicalAlerts } from './../../../../objects/request/MedicalAlerts';
import { Component, OnInit, HostListener } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { forkJoin } from 'rxjs';
import { distinctUntilChanged, debounceTime, filter, map } from 'rxjs/operators';
import {
  MedicalCoverageSelected,
  ContactPerson,
  CapPerVisit,
  Copayment,
  CoverageSelected,
  SelectedPlans
} from '../../../../objects/MedicalCoverage';
import { PatientVisit, VisitPurpose } from '../../../../objects/request/PatientVisit';
import { Address, Contact, UserId, UserRegistration } from '../../../../objects/UserRegistration';
import { ApiPatientInfoService } from '../../../../services/api-patient-info.service';
import { ApiPatientVisitService } from '../../../../services/api-patient-visit.service';
import { ApiCmsManagementService } from './../../../../services/api-cms-management.service';
import { PatientService } from '../../../../services/patient.service';
import { PatientAddConfirmationComponent } from './../../../../components/patient-add/patient-add-confirmation/patient-add-confirmation.component';
import {
  DISPLAY_DATE_FORMAT,
  ALLERGY_TYPES,
  ALERT_PRIORITY,
  ALERT_TYPES,
  ALLERGIES
} from './../../../../constants/app.constants';
import { SelectedPlan } from './../../../../objects/MedicalCoverage';
import { Company } from './../../../../objects/UserRegistration';
import { AlertService } from './../../../../services/alert.service';
import { StoreService } from './../../../../services/store.service';
import { SelectedItem } from './../../medical-coverage/assign-medical-coverage/assign-medical-coverage.component';
@Component({
  selector: 'app-patient-add',
  templateUrl: './patient-add.component.html',
  styleUrls: ['./patient-add.component.scss']
})
export class PatientAddComponent implements OnInit {
  patientAddFormGroup: FormGroup;
  patientInfo = [
    {
      title: '',
      preferredMethodOfCommunication: '',
      consentGiven: true,
      race: '',
      preferredLanguage: '',
      name: '',
      companyId: '',
      dob: '',
      idType: '',
      idNumber: '',
      country: '',
      countryCode: 65,
      gender: '',
      contactNumber: '',
      status: '',
      address: '',
      postcode: '',
      email: '',
      emergencyContact: { name: '', contact: '', relationship: null },
      company: {
        company: '',
        address: '',
        postalCode: '',
        occupation: ''
      },
      nationality: '',
      maritalStatus: '',
      allergies: [],
      medicalAlerts: [],
      patientID: '',
      patientNumber: ''
    }
  ];

  patientVisitEntry: PatientVisitEntry;
  bsConfig: Partial<BsDatepickerConfig>;

  error: string;

  // Medical Coverage
  coverageBsModalRef: BsModalRef;
  specialRemarks: string;
  startDate: Date;
  endDate: Date;
  selectedMedicalCoverage: any;
  selectedCoverageType = new Set();

  // Medical Alerts
  medicalAlerts: MedicalAlerts[] = [];
  // Confirmation
  confirmationBsModalRef: BsModalRef;
  confirmationInput: SelectedItem[];

  // Registry Entry
  preferredDoctorId: string;
  registryRemarks: string;
  purposeOfVisit: string;
  // @Input() attachedMedicalCoverages: FormArray;

  plans: SelectedPlans[] = [];
  newPlans: SelectedPlan[] = [];
  attachedPlans;
  selectedPlans: Array<SelectedPlan> = new Array<SelectedPlan>();
  attachedPlansForConsultation;

  constructor(
    private apiPatientService: ApiPatientVisitService,
    private apiPatientInfoService: ApiPatientInfoService,
    private apiCmsManagementService: ApiCmsManagementService,
    private patientService: PatientService,
    private store: StoreService,
    private alertService: AlertService,
    private modalService: BsModalService,
    private utilsService: UtilsService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.bsConfig = Object.assign({}, { containerClass: 'theme-blue' });
  }

  ngOnInit() {
    if (this.store.getClinicId() !== '' || this.store.getClinicId() === undefined) {
      if (localStorage.getItem('clinicId')) {
        this.store.clinicId = localStorage.getItem('clinicId');
      }
    }

    this.patientService.resetPatientAddFormGroup();
    this.patientAddFormGroup = this.patientService.getPatientAddFormGroup();
    this.subscribeValueChanges();
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.keyCode === 115) {
      console.log('F4');
      if (this.patientAddFormGroup.valid) {
        this.onBtnNextClicked('');
      }
    }
  }

  onBtnNextClicked(event) {
    const initialState = {
      title: 'Confirmation of Patient Visit',
      selectedPlan: <FormArray>this.patientAddFormGroup.get('selectedPlans').value,
      attachedMedicalCoverages: <FormArray>this.patientAddFormGroup.get('attachedPlans').value
    };

    this.confirmationBsModalRef = this.modalService.show(PatientAddConfirmationComponent, {
      initialState,
      class: 'modal-lg'
    });

    this.confirmationBsModalRef.content.event.subscribe(data => {
      if (data) {
        this.confirmationInput = data;
        this.preferredDoctorId = data[0].preferredDoctor;
        this.registryRemarks = data[0].remarks;
        this.purposeOfVisit = data[0].purposeOfVisit;
        this.attachedPlansForConsultation = data[0].attachedMedicalCoverages;
        this.newPlans = data[1];
        this.attachedPlans = data[2];
      } else {
        console.log('No data emitted');
      }

      this.confirmationBsModalRef.content.event.unsubscribe();
      this.confirmationBsModalRef.hide();

      this.registerSubmit();
    });
  }

  subscribeValueChanges() {
    const patientInfo = this.patientInfo;
    const alertFormGroup = this.patientAddFormGroup.get('alertFormGroup');
    const medicalAlertFormGroup = this.patientAddFormGroup.get('medicalAlertFormGroup');
    const fullIdArrayFormGroup = this.patientAddFormGroup.get('basicInfoFormGroup').get('fullId');

    const alertArray = alertFormGroup.get('alertArray') as FormArray;
    const medicalAlertArray = medicalAlertFormGroup.get('alertArray') as FormArray;

    alertFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        if (values.isAdd) {
          alertFormGroup.patchValue({
            isAdd: false
          });
          alertArray.push(this.newAllergyAlertArrayItem());
        }
      });

    medicalAlertFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
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
      debounceTime(200),
      map(val => {
        fullIdArrayFormGroup.get('id').markAsTouched();
        fullIdArrayFormGroup.get('idType').markAsTouched();

        if (val.id || val.idType) {
          fullIdArrayFormGroup
            .get('id')
            .setAsyncValidators([
              this.patientService.checkWhetherUserExists(
                this.apiPatientInfoService, fullIdArrayFormGroup.get('idType'),
                'idType'),
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
        patientInfo[0].idNumber = values.id;
        patientInfo[0].idType = values.idType;

        fullIdArrayFormGroup.get('id').clearAsyncValidators();

        const countryFC = this.patientAddFormGroup.get('basicInfoFormGroup').get('country');

        if (!countryFC.value) {
          if (values.idType === 'PASSPORT') {
            countryFC.setValidators(Validators.required);
            countryFC.markAsTouched();
            countryFC.updateValueAndValidity();
          } else {
            countryFC.clearValidators();
            countryFC.markAsTouched();
            countryFC.updateValueAndValidity();
          }
        } else {
          if (values.idType === 'PASSPORT') {
            countryFC.setValidators(Validators.required);
            countryFC.markAsTouched();
            countryFC.updateValueAndValidity();
          } else {
            // countryFC.reset();
            countryFC.clearValidators();
            countryFC.markAsTouched();
            countryFC.updateValueAndValidity();
          }
        }

        console.log('VALIDATOARS : ', this.patientAddFormGroup.get('basicInfoFormGroup').get('country'));
      });

    this.patientAddFormGroup
      .get('basicInfoFormGroup')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        patientInfo[0].countryCode = 65; // values.countryCode;
        patientInfo[0].country = values.country;
        patientInfo[0].title = values.title;
        patientInfo[0].name = values.name;
        patientInfo[0].gender = values.gender;
        patientInfo[0].contactNumber = values.contactNumber;
        patientInfo[0].countryCode = values.contactNumber;
        patientInfo[0].dob = moment(values.birthday).format(DISPLAY_DATE_FORMAT);
        patientInfo[0].address = values.address1 + '\n' + values.address2;
        patientInfo[0].email = values.email;
        patientInfo[0].maritalStatus = values.maritalStatus;
        patientInfo[0].postcode = values.postcode;
        patientInfo[0].preferredMethodOfCommunication = values.preferredMethodOfCommunication;
        patientInfo[0].consentGiven = values.consentGiven;

        console.log('patientAddFormGroup: ', this.patientAddFormGroup.get('basicInfoFormGroup'));
      });

    this.patientAddFormGroup.get('medicalCoverageFormGroup').valueChanges.subscribe(values => {
      this.selectedMedicalCoverage = values.selectedPlans;
      this.createMedicalCoverages(this.selectedMedicalCoverage);
    });

    this.patientAddFormGroup.get('selectedPlans').valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        console.log("VALUE CHANGES: ", values);
        this.patientAddFormGroup.get('selectedPlans').updateValueAndValidity();
      });

    this.patientAddFormGroup
      .get('emergencyContactFormGroup')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        patientInfo[0].emergencyContact.name = values.name;
        patientInfo[0].emergencyContact.contact = values.contact;
        patientInfo[0].emergencyContact.relationship = values.relationship;

        if (values.name || values.contact) {
          this.patientAddFormGroup
            .get('emergencyContactFormGroup')
            .get('relationship')
            .setValidators([Validators.required]);
          this.patientAddFormGroup
            .get('emergencyContactFormGroup')
            .get('relationship')
            .markAsTouched();
          this.patientAddFormGroup
            .get('emergencyContactFormGroup')
            .get('relationship')
            .updateValueAndValidity();
        } else {
          this.patientAddFormGroup
            .get('emergencyContactFormGroup')
            .get('relationship')
            .setValidators(null);
          this.patientAddFormGroup
            .get('emergencyContactFormGroup')
            .get('relationship')
            .patchValue(null);
          this.patientAddFormGroup
            .get('emergencyContactFormGroup')
            .get('relationship')
            .markAsTouched();
          this.patientAddFormGroup
            .get('emergencyContactFormGroup')
            .get('relationship')
            .updateValueAndValidity();
          patientInfo[0].emergencyContact.relationship = null;
        }
      });

    this.patientAddFormGroup
      .get('otherInfoFormGroup')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        patientInfo[0].nationality = values.nationality;
        patientInfo[0].race = values.race;
        patientInfo[0].preferredLanguage = values.languageSpoken;
      });

    this.patientAddFormGroup
      .get('companyInfoFormGroup')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        patientInfo[0].company.company = values.company;
        patientInfo[0].company.occupation = values.occupation;
        patientInfo[0].company.address = values.address1 + '\n' + values.address2;
        patientInfo[0].company.postalCode = values.postalCode;
      });
  }

  createMedicalCoverages(values) {
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
        id: selectedItem.planSelected.id,
        name: selectedItem.planSelected.name,
        capPerVisit: capPerVisit,
        capPerWeek: capPerWeek,
        capPerMonth: capPerMonth,
        capPerYear: capPerYear,
        capPerLifeTime: capPerLifeTime,
        copayment: copayment,
        limitResetType: '',
        code: selectedItem.planSelected.code,
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

    console.log('Medical Coverages selected: ', this.plans);
  }
  setPatientData(): UserRegistration {
    const pInfo = this.patientInfo[0];

    const userId: UserId = {
      idType: pInfo.idType,
      number: pInfo.idNumber
    };

    const contactNumber: Contact = {
      countryCode: 65, // pInfo.contactNumber,
      number: pInfo.contactNumber // pInfo.contactNumber
    };

    const emergencyContact: Contact = {
      countryCode: 65, /// pInfo.contactNumber,
      number: pInfo.emergencyContact.contact,
      name: pInfo.emergencyContact.name,
      relationship: pInfo.emergencyContact.relationship
    };

    const company: Company = {
      name: pInfo.company.company,
      address: pInfo.company.address,
      postalCode: pInfo.company.postalCode,
      occupation: pInfo.company.occupation
    };

    const address: Address = {
      address: pInfo.address,
      country: pInfo.country ? pInfo.country : 'Singapore',
      postalCode: pInfo.postcode
    };

    const user: UserRegistration = {
      title: pInfo.title,
      preferredMethodOfCommunication: pInfo.preferredMethodOfCommunication,
      consentGiven: pInfo.consentGiven,
      race: pInfo.race,
      preferredLanguage: pInfo.preferredLanguage,
      name: pInfo.name,
      dob: pInfo.dob,
      userId: userId,
      gender: pInfo.gender,
      contactNumber: contactNumber,
      status: 'ACTIVE',
      address: address,
      emailAddress: pInfo.email,
      emergencyContactNumber: emergencyContact,
      company: company,
      nationality: pInfo.nationality,
      maritalStatus: pInfo.maritalStatus,
      allergies: pInfo.allergies
    };
    return user;
  }

  registerSubmit() {
    const user = this.setPatientData();

    this.apiPatientInfoService.register(user).subscribe(
      res => {
        this.patientInfo[0].patientID = res.payload.id;
        if (this.patientInfo[0].patientID) {
          if (this.addMedicalAlerts()) {
            console.log('Patient registered and medical alerts added successfully');
          } else {
            console.log('Patient registered successfully, but unable to add medical alerts');
          }
        } else {
          console.log('Patient ID not found');
        }

        if ((<FormArray>this.patientAddFormGroup.get('selectedPlans')).length > 0) {
          this.assignPolicy();
        } else {
          this.addPatientToRegistry([]);
        }
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );
  }

  addMedicalAlerts(): Boolean {
    if (this.patientInfo[0].medicalAlerts.length > 0) {
      console.log('ADDING MEDICAL ALERTS: ', this.patientInfo[0].medicalAlerts);
      this.apiPatientInfoService.addAlert(this.patientInfo[0].patientID, this.patientInfo[0].medicalAlerts).subscribe(
        arr => {
          console.log('success in adding');
          return true;
        },
        err => {
          if (err.error.message === 'Alert already assigned') {
            console.log('IGNORE ALERT ------> Alert already assign <---------');
          } else {
            this.alertService.error(JSON.stringify(err.error.message));
            return false;
          }
        }
      );
    } else {
      console.log('no need to map anything');
    }
    return false;
  }

  assignPolicy() {
    const policyHolders = [];
    const policyTypes = [];
    const plans = this.patientAddFormGroup.get('selectedPlans').value;
    console.log("ATTACHED PLANS: ", plans);
    console.log("ATTACHED MEDICAL COVERAGE: ", this.patientAddFormGroup.get('attachedPlans').value);

    plans.forEach(plan => {
      const holderDetails = {
        identificationNumber: {
          idType: this.patientInfo[0].idType,
          number: this.patientInfo[0].idNumber
        },
        name: this.patientInfo[0].name,
        medicalCoverageId: plan.medicalCoverageId,
        planId: plan.planId,
        patientCoverageId: plan.patientCoverageId,
        specialRemarks: plan.remarks,
        status: 'ACTIVE',
        startDate: plan.startDate,
        endDate: plan.endDate,
        costCenter: plan.costCenter
      };
      const policyType = plan.coverageSelected.type;

      policyHolders.push(holderDetails);
      policyTypes.push(policyType);

      this.selectedCoverageType.add(plan.coverageType);
    });

    forkJoin(
      policyHolders.map((plan, index) =>
        this.apiPatientInfoService.assignPolicy(policyTypes[index], policyHolders[index])
      )
    ).subscribe(
      arr => {
        console.log('POLICY RESULTS: ', arr);

        const policies = arr || [];
        this.addPatientToRegistry(policies);
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );
  }

  addPatientToRegistry(policies) {
    console.log("thisattachedplan: ", this.attachedPlans);

    const medCoverage: AttachedMedicalCoverage[] = [];

    if (this.attachedPlans.length > 0) {
      this.attachedPlans.forEach(plan => {

        const p = policies.find(function (policy) {

          console.log("p: ", p);
          return (policy.payload.medicalCoverageId === plan.medicalCoverageId
            && policy.payload.planId === plan.planId);
        });

        const tempCoverage: AttachedMedicalCoverage = {
          coverageId: p.payload.id,
          medicalCoverageId: p.payload.medicalCoverageId,
          planId: p.payload.planId
        };

        console.log("tempCoverage: ", tempCoverage);
        medCoverage.push(tempCoverage);
      });
    }

    // Visit Purpose and Patient Registry
    const visitPurpose: VisitPurpose = {
      name: this.purposeOfVisit,
      consultationRequired: true
    };

    const patientRegistryEntry: PatientVisitEntry = {
      patientId: this.patientInfo[0].patientID,
      clinicId: this.store.clinicId,
      attachedMedicalCoverages: medCoverage,
      remark: this.registryRemarks,
      visitPurpose: visitPurpose,
      preferredDoctorId: this.preferredDoctorId
    };

    console.log('PATIENT REIGSTRY:', patientRegistryEntry);

    this.apiPatientService.initCreate(patientRegistryEntry).subscribe(
      res => {
        console.log('Added patient into registry: ', res);
        if (res) {
          console.log(res);
          this.router.navigate(['patient']);
        }
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );
  }

  // managing allergy alerts
  newAllergyAlertArrayItem() {
    const types = this.utilsService.convertStringArrayToMenuOptions(ALLERGY_TYPES);
    const allergies = this.utilsService.convertStringArrayToMenuOptions(ALLERGIES);

    const item = this.fb.group({
      types: { value: types },
      type: ['', Validators.required],
      allergies: { value: allergies },
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
    const types = this.utilsService.convertStringArrayToMenuOptions(ALLERGY_TYPES);
    const allergies = this.utilsService.convertStringArrayToMenuOptions(ALLERGIES);

    const item = this.fb.group({
      types: { value: types },
      type: [allergy.allergyType, Validators.required],
      allergies: { value: allergies },
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

  subscribeAlertArrayItemValueChanges(item: FormGroup, values) {
    const pInfo = this.patientInfo[0];

    if (values.isDelete) {
      pInfo.allergies.splice(values.deleteIndex, 1);
      return;
    }

    const formArray = item.parent as FormArray;
    const index = formArray.value.map(arr => JSON.stringify(arr)).indexOf(JSON.stringify(values));
    const info = pInfo.allergies[index];
    if (!info) {
      const updatedInfo = <any>{
        allergyType: values.type,
        name: values.name,
        remarks: values.remarks,
        addedDate: moment().format(DISPLAY_DATE_FORMAT)
      };
      pInfo.allergies.push(updatedInfo);
    } else {
      info.allergyType = values.type;
      info.name = values.name;
      info.remarks = values.remarks;
      info.addedDate = values.addedDate;
    }
  }

  // managing medical alerts
  newMedicalAlertArrayItem() {
    const types = this.utilsService.convertStringArrayToMenuOptions(ALERT_TYPES);
    const priorities = this.utilsService.convertStringArrayToMenuOptions(ALERT_PRIORITY);

    const item = this.fb.group({
      types: { value: types },
      type: '',
      name: ['', Validators.required],
      remark: '',
      priority: ['', Validators.required],
      priorityDropDown: { value: priorities },
      addedDate: moment().format(DISPLAY_DATE_FORMAT),
      isDelete: false,
      deleteIndex: -1,
      isEdit: true
    });

    console.log("item added: ", item);

    item.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.subscribeMedicalAlertArrayItemValueChanges(item, values));

    return item;
  }

  formatMedicalAlertArrayItem(medicalAlert) {
    const types = this.utilsService.convertStringArrayToMenuOptions(ALERT_TYPES);
    const priorities = this.utilsService.convertStringArrayToMenuOptions(ALERT_PRIORITY);

    const item = this.fb.group({
      types: { value: types },
      type: medicalAlert.type,
      name: medicalAlert.name,
      remarks: medicalAlert.remarks,
      priority: medicalAlert.priority,
      priorityDropDown: { value: priorities },
      addedDate: medicalAlert.addedDate,
      isDelete: false,
      deleteIndex: -1,
      isEdit: true
    });

    item.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.subscribeMedicalAlertArrayItemValueChanges(item, values));
    return item;
  }

  subscribeMedicalAlertArrayItemValueChanges(item: FormGroup, values) {
    const pInfo = this.patientInfo[0];

    if (values.isDelete) {
      pInfo.medicalAlerts.splice(values.deleteIndex, 1);
      return;
    }

    const formArray = item.parent as FormArray;
    const index = formArray.value.map(arr => JSON.stringify(arr)).indexOf(JSON.stringify(values));
    const info = pInfo.medicalAlerts[index];
    if (!info) {
      const updatedInfo = <any>{
        alertType: values.type,
        name: values.name,
        remark: values.remark,
        priority: values.priority,
        addedDate: values.addedDate,
        // expiryDate: values.expiryDate
        // addedDate: moment(values.addedDate).format(DISPLAY_DATE_FORMAT),
        expiryDate: moment(values.expiryDate).format(DISPLAY_DATE_FORMAT)
      };
      pInfo.medicalAlerts.push(updatedInfo);
    } else {
      info.alertType = values.type;
      info.name = values.name;
      info.remark = values.remark;
      info.priority = values.priority;
      info.addedDate = values.addedDate;
      // info.expiryDate = values.expiryDate;
      // info.addedDate = moment(values.addedDate).format(DISPLAY_DATE_FORMAT);
      info.expiryDate = moment(values.expiryDate).format(DISPLAY_DATE_FORMAT);
    }

    console.log("item changed: ", item);
  }

  toggleHide() {
    const elementClickedOn = document.getElementById('addMorePatientInformation');
    elementClickedOn.style.display = 'none';

    // elementClickedOn.style.visibility = "hidden";

    const element = document.getElementById('otherPatientInfo');
    element.style.display = 'block';
    element.style.visibility = 'visible';
  }
}

class PatientVisitEntry implements PatientVisit {
  patientId: string;
  clinicId: string;
  preferredDoctorId: string;
  attachedMedicalCoverages: AttachedMedicalCoverage[];
  remark: string;
  visitPurpose: VisitPurpose;
}

interface AttachedMedicalCoverage {
  coverageId: string;
  medicalCoverageId: string;
  planId: string;
}
