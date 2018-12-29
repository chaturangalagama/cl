import { MedicalCoverageResponse } from './../../../objects/response/MedicalCoverageResponse';
import { MedicalCoverageComponent } from './../../../views/components/medical-coverage/medical-coverage/medical-coverage.component';
import { PatientAddQueueConfirmationComponent } from './../../patient-add/patient-add-queue-confirmation/patient-add-queue-confirmation.component';
import { ApiCmsManagementService } from './../../../services/api-cms-management.service';
import { ApiPatientVisitService } from './../../../services/api-patient-visit.service';
import {
  AssignMedicalCoverageComponent,
  SelectedItem
} from './../../../views/components/medical-coverage/assign-medical-coverage/assign-medical-coverage.component';
import { UtilsService } from './../../../services/utils.service';
import { AlertService } from './../../../services/alert.service';
import { Allergy } from './../../../objects/response/Allergy';
import { MedicalAlert } from './../../../objects/response/MedicalAlert';
import { MedicalAlertResponse } from './../../../objects/response/MedicalAlertResponse';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiPatientInfoService } from './../../../services/api-patient-info.service';
import { Component, OnInit, Input } from '@angular/core';
import { StoreService } from '../../../services/store.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { UserRegistrationObject } from '../../../objects/UserRegistrationObject';
import { DISPLAY_DATE_FORMAT } from '../../../constants/app.constants';

@Component({
  selector: 'app-consultation-patient-info',
  templateUrl: './consultation-patient-info.component.html',
  styleUrls: ['./consultation-patient-info.component.scss']
})
export class ConsultationPatientInfoComponent implements OnInit {
  @Input() hideAlerts = false;
  @Input() patientNameRedirect = false;
  @Input() selectedPlans: FormArray;
  selectedItems: SelectedItem[];
  bsModalRef: BsModalRef;
  alerts: Array<Allergy>;
  medicalAlerts: Array<MedicalAlertResponse>;
  patientInfo: UserRegistrationObject;
  patientCoverages = [];
  visitCoverageArray = [];
  coverages;

  patientNo: string;
  patientName: string;
  age: string;
  sex: string;
  dob: string;
  nric: string;
  occupation: string;
  address: string;
  address1: string;
  address2: string;
  postal: string;
  maritalStatus: string;
  contactNo: string;
  priorityMedicalCoverage: string;
  attachedMedicalCoverages: FormArray;

  constructor(
    private apiPatientInfoService: ApiPatientInfoService,
    private apiPatientVisitService: ApiPatientVisitService,
    private apiCmsManagementService: ApiCmsManagementService,
    private storeService: StoreService,
    private router: Router,
    private alertService: AlertService,
    private utilService: UtilsService,
    private modalService: BsModalService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    // this.initPatientInfo('', '', null, '', '', '', '', '', '', '', '', '', '');
    this.initPatientInfo('', '', null, '', '', '', '', '', '', '', '', '', '');

    this.initPage();

    this.initPriorityMedicalCoverage();

    this.initMedicalCoverages();
  }

  initPage() {
    const patientId = this.storeService.getPatientId();
    // if (patientId) {
    this.apiPatientInfoService.searchBy('systemuserid', patientId).subscribe(
      res => {
        this.patientInfo = res.payload;
        const { address } = this.patientInfo;

        const separatedAddress = (address.address || '').split('\n');

        const { company } = this.patientInfo;
        let occupation = '';
        if (company) {
          occupation = company.occupation;
        }

        console.log('this.patientInfo: ', this.patientInfo);

        let age = moment().diff(moment(this.patientInfo.dob, DISPLAY_DATE_FORMAT), 'years');
        let ageQuantifier = ' years';
        console.log('PATIENT AGE', age);
        if (age < 1) {
          age = moment().diff(moment(this.patientInfo.dob, DISPLAY_DATE_FORMAT), 'months');
          ageQuantifier = ' months';
        }
        if (age < 1) {
          age = moment().diff(moment(this.patientInfo.dob, DISPLAY_DATE_FORMAT), 'days');
          ageQuantifier = ' days';
        }
        console.log('PATIENT AGE', age);

        this.initPatientInfo(
          this.patientInfo.patientNumber ? this.patientInfo.patientNumber : '-',
          this.patientInfo.name,
          '' + age + ageQuantifier,
          this.patientInfo.gender,
          this.patientInfo.dob,
          this.patientInfo.userId.number,
          occupation,
          `${
          address.address // `${address.address}, ${address.country} ${address.postalCode}`, //todo need to add back the country after handling it registration
          },  ${address.postalCode}`,
          separatedAddress[0] ? separatedAddress[0] : '',
          // separatedAddress[1] || separatedAddress[1] !== undefined ? separatedAddress[1] : '',
          separatedAddress[1] ? separatedAddress[1] : '',
          `${address.postalCode}`,
          this.patientInfo.maritalStatus,
          `${
          this.patientInfo.contactNumber.number // `${this.patientInfo.contactNumber.countryCode}-${this.patientInfo.contactNumber.number}`
          }`
        );
        this.alerts = this.patientInfo.allergies;
        console.log('ALLERGY ALERTS: ', this.alerts);
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );

    this.medicalAlerts = Array<MedicalAlertResponse>();
    this.apiPatientInfoService.listAlert(patientId).subscribe(
      res => {
        if (res.payload) {
          const alertDetails = <Array<MedicalAlertResponse>>res.payload.details;
          const tempAlertArray = Array<MedicalAlertResponse>();
          alertDetails.forEach(alert => {
            if (alert.alertType !== 'ALLERGY') {
              tempAlertArray.push(alert);
            }
          });
          this.medicalAlerts = tempAlertArray;
          console.log('MEDICAL ALERTS: ', this.medicalAlerts);
        }
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );
    //   } else {
    //     alert('No Patient ID');
    //  //   this.router.navigate(['pages/patient/list']);
    //   }
  }

  initPatientInfo(
    patientNo: string,
    patientName: string,
    age: string,
    sex: string,
    dob: string,
    nric: string,
    occupation: string,
    address: string,
    address1: string,
    address2: string,
    postal: string,
    maritalStatus: string,
    contactNo: string
  ) {
    this.patientNo = patientNo;
    this.patientName = patientName;
    this.age = age;
    this.sex = sex;
    this.dob = dob;
    this.nric = nric;
    this.occupation = occupation;
    this.address = this.utilService.convertToTitleCaseUsingSpace(address);
    this.address1 = this.utilService.convertToTitleCaseUsingSpace(address1);
    // this.address2 = this.utilService.convertToTitleCaseUsingSpace(address2);
    this.address2 = address2 === undefined ? '' : this.utilService.convertToTitleCaseUsingSpace(address2);
    this.postal = this.utilService.convertToTitleCaseUsingSpace(postal);
    this.maritalStatus = maritalStatus;
    this.contactNo = contactNo;
  }

  initMedicalCoverages() {
    const medicalCoverages = this.storeService.getMedicalCoverages();


    // this.consultationInfo = res.payload;
    // console.log('consultation info: ', this.consultationInfo);
    // this.initConsultationInfo();

    // === Retrive AttachedMedicalCoverage for this Patient ===
    // this.apiPatientVisitService.patientVisitSearch(this.storeService.getPatientVisitRegistryId()).subscribe(res => {
    //   const attachedMedicalCoverage = res.payload.patientVisitRegistry.attachedMedicalCoverages;
    //   const observableBatch = [];
    //   attachedMedicalCoverage.forEach(ele => {
    //     observableBatch.push(this.apiCmsManagementService.searchCoverage(ele.medicalCoverageId));
    //   });

    //   Observable.forkJoin(observableBatch).subscribe(
    //     coverageArr => {
    //       // Merge array of payload into one array
    //       coverageArr.forEach(e => {
    //         const arrayE = e['payload'] as any[];
    //         arrayE.forEach(f => {
    //           this.patientCoverages.push(f);
    //         });
    //       });
    //       // Option for Cash
    //       // this.visitCoverageArray.push({ 'name': 'CASH', 'type': 'CASH', 'planDetail': { id: 0 } }); //Remove option for Cash
    //       attachedMedicalCoverage.forEach(element => {
    //         const coverage = this.patientCoverages.find(val => val.id === element.medicalCoverageId);
    //         const plan = coverage.coveragePlans.find(val => val.id === element.planId);

    //         console.log('aa coverage: ', coverage);
    //         console.log('aa plan: ', plan);

    //         this.visitCoverageArray.push({
    //           name: `${coverage.name}\n${plan.name}`,
    //           type: coverage.type,
    //           planDetail: plan
    //         });

    //         console.log('this.visitCoverageArray: ', this.visitCoverageArray);
    //         const initialLimit = plan.capPerVisit.limit || 0;
    //       });

    //       console.log('attachedMedicalCoverage: ', attachedMedicalCoverage);

    //       this.patchToFormArray();
    //     },
    //     err => this.alertService.error(JSON.stringify(err.error.message))
    //   );
    //   err => this.alertService.error(JSON.stringify(err.error.message));
    // });
  }

  openPatientDetail() {
    window.open(`/pages/patient/detail/${this.patientInfo.id}`);
    // this.router.navigate([`/pages/patient/detail/${this.patientInfo.id}`]);
  }

  getPatientDetailRoute() {
    if (this.patientInfo && this.patientInfo.id) {
      return `/pages/patient/detail/${this.patientInfo.id}`;
    } else {
      return '';
    }
  }

  patchToFormArray() {
    console.log('this.selectedPlans: ', this.selectedPlans);
    console.log('this.visitCoverageArray: ', this.visitCoverageArray);
  }

  // showMedicalCoverages() {
  //   const initialState = {
  //     title: 'Medical Coverage Summary',
  //     selectedCoverages: this.visitCoverageArray
  //   };
  //   this.bsModalRef = this.modalService.show(AssignMedicalCoverageComponent, {
  //     initialState,
  //     class: 'modal-lg',
  //     backdrop: 'static',
  //     keyboard: false
  //   });
  //   if (this.selectedItems) {
  //     this.bsModalRef.content.setSelectedItems(this.selectedItems);
  //   }

  //   this.bsModalRef.content.event.subscribe(data => {
  //     if (data) {
  //       console.log('POP UP RETURNED DATA', data);

  //       // The data return is in FormArray of objects/MedicalCoverage.SelectedPlan
  //       this.selectedPlans = data;
  //       this.selectedPlans.updateValueAndValidity();
  //       this.bsModalRef.content.event.unsubscribe();
  //       this.bsModalRef.hide();
  //     }
  //   });
  // }


  initPriorityMedicalCoverage() {
    // this.apiPatientInfoService.searchAssignedPoliciesByUserId(this.storeService.getPatientVisitRegistryId()).subscribe(
    //   resp => {
    //     if (resp.payload) {
    //       this.coverages = new MedicalCoverageResponse(
    //         resp.payload.INSURANCE,
    //         resp.payload.CORPORATE,
    //         resp.payload.CHAS,
    //         resp.payload.MEDISAVE
    //       );
    //     }
    //   },
    //   err => this.alertService.error(JSON.stringify(err))
    // );
    this.attachedMedicalCoverages = this.fb.array([]);


    this.apiPatientVisitService.patientVisitSearch(this.storeService.getPatientVisitRegistryId()).subscribe(
      res => {
        console.log("res MC: ", res.payload);

        const attachedMCs = res.payload.patientVisitRegistry.attachedMedicalCoverages;

        attachedMCs.forEach(coverage => {
          this.attachedMedicalCoverages.value.push(coverage);
        })

        if (this.attachedMedicalCoverages.value.length > 0) {
          const medicalCoverages = this.storeService.getMedicalCoverages();

          const first = this.attachedMedicalCoverages.value[0];
          const priorityMC = medicalCoverages.find(function (x) {
            return (x.id === first.medicalCoverageId);
          });

          this.priorityMedicalCoverage = priorityMC ? priorityMC.name : '';

        } else {
          this.priorityMedicalCoverage = '';
        }
      },
      err => {
        this.alertService.error(JSON.stringify(err));
      }
    );
  }

  showMedicalCoverages() {
    this.apiPatientVisitService.patientVisitSearch(this.storeService.getPatientVisitRegistryId()).subscribe(
      res => {
        const {
          payload: {
            patientVisitRegistry: { attachedMedicalCoverages }
          }
        } = res;

        // console.log('ATTACHED MEDICAL COVERAGES: ', attachedMedicalCoverages);
        this.displayMedicalCoveragesModal(
          this.storeService.getPatientId(),
          this.storeService.getPatientVisitRegistryId(),
          attachedMedicalCoverages
        );
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.displayMedicalCoveragesModal(
          this.storeService.getPatientId(),
          this.storeService.getPatientVisitRegistryId(),
          []
        );
      }
    );
  }



  displayMedicalCoveragesModal(patientId: string, patientRegistryId: string, attachedMedicalCoverages: any[]) {
    // this.currPatientId = patientId;


    this.storeService.setPatientId(patientId);
    const initialState = {
      title: 'Assigned Medical Coverages',
      type: 'DISPLAY_MEDICAL_COVERAGE',
      selectedCoverages: this.attachedMedicalCoverages,
      patientCoverages: new FormControl(),
      displaySelectedCoverages: true
      // selectedPlans: this.coverages
    };

    // this.bsModalRef = this.modalService.show(PatientAddQueueConfirmationComponent, {
    this.bsModalRef = this.modalService.show(MedicalCoverageComponent, {
      initialState,
      class: 'modal-lg'
    });

    this.bsModalRef.content.event.subscribe(data => {
      if (data) {

        if (data !== 'Close') {
          // Patient Visit Attach Medical Coverage
          this.apiPatientVisitService.attachMedicalCoverage(patientRegistryId, data.attachedMedicalCoverages).subscribe(
            res => {
              this.bsModalRef.content.event.unsubscribe();
              this.bsModalRef.hide();
              this.storeService.setPatientId('');
            },
            err => {
              this.alertService.error(JSON.stringify(err));
            }
          );
        } else {
          this.bsModalRef.hide();
        }
      } else {
        console.log('No data emitted');
      }
    });
  }


}
