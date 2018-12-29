import { UtilsService } from './utils.service';
import { DISPLAY_DATE_FORMAT } from './../constants/app.constants';
import { StoreStatus } from './../objects/StoreStatus';
import { Practice } from './../objects/SpecialityByClinic';
import { Router, NavigationStart } from '@angular/router';
import { Observable ,  Subject ,  AsyncSubject ,  timer } from 'rxjs';
import { Clinic } from './../objects/response/Clinic';
import { Injectable, OnDestroy } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';

import { LoggerService } from './logger.service';
import { ApiPatientVisitService } from './api-patient-visit.service';
import { ApiPatientInfoService } from './api-patient-info.service';
import { AllergyGroup } from './../objects/response/AllergyGroup';
import { PatientRegistryListResponse } from './../objects/response/PatientRegistryListResponse';
import { AuthService } from './auth.service';
import { User } from './../objects/response/User';

import { MedicalTest } from './../objects/response/MedicalTestListAll';
import { DrugItem, Instruction, DosageInstruction } from './../objects/DrugItem';
import { Uom } from './../objects/Uom';
import { MedicalCoverageSelected } from './../objects/MedicalCoverage';
import { MedicalServiceResponse } from '../objects/response/MedicalServiceResponse';
import { Vaccine } from '../objects/response/VaccinationList';

import { AlertService } from '../services/alert.service';
import { ApiCmsManagementService } from '../services/api-cms-management.service';

import { PatientService } from '../services/patient.service';
import { PaymentService } from '../services/payment.service';
import { VitalService } from './vital.service';

import * as moment from 'moment';

@Injectable()
export class StoreService implements OnDestroy {
  private isClinicLoaded = new Subject();
  private headerRegistry = new Subject();
  private isStoreReady = new Subject();

  currentConsultationRoute = 'route1';

  private patientId: string;
  private _caseId: string;
 
  consultationId: string;
  private patientVisitRegistryId: string;
  private user: User;

  medicalCoverageList: Array<MedicalCoverageSelected> = [];
  medicalCoverageListWithExpired: Array<MedicalCoverageSelected> = [];
  visitPurposeList = [];

  authorizedClinicList = [];
  private clinicList = new Array<Clinic>();

  // clinicclinic = [];
  doctorList = [];
  doctorListByClinic = [];
  clinicId: string;
  clinicCode: string;
  clinic: Clinic;

  medicalServiceList: MedicalServiceResponse[] = [];
  drugList: DrugItem[] = [];
  vaccinationList: Vaccine[] = [];
  medicalTestList: MedicalTest[] = [];
  chargeItemList = [];

  medicalServiceListOptions = [];
  drugListOptions = [];
  chargeItemListOptions= [];
  vaccinationListOptions = [];
  medicalTestListOptions = [];
  allergyGroupList: AllergyGroup[] = [];
  allergyGroupListOptions = [];

  uoms: Array<Uom> = new Array();

  specialitiesList: Practice[];

  patientRegistry: Array<PatientRegistryListResponse>;

  errorMessages = [];

  notificationList = [];
  unreadNotificationList = [];
  notificationPolling: any;
  registryPolling: any;

  private doctorTemplate: {};
  private globalTemplate: {};
  private templates: {};
  private instructions: Array<Instruction>;
  private dosageInstructions: Array<DosageInstruction>;

  // Store Status
  private storeSuccessCount = 0;
  private storeFailCount = 0;
  private storeStatus: StoreStatus;

  constructor(
    private permissionsService: NgxPermissionsService,
    private authService: AuthService,
    private alertService: AlertService,
    private apiCmsManagementService: ApiCmsManagementService,
    private apiPatientInfoService: ApiPatientInfoService,
    private patientService: PatientService,
    private paymentService: PaymentService,
    private utilsService: UtilsService,
    private apiPatientVisitService: ApiPatientVisitService,
    private logger: LoggerService,
    private router: Router
  ) {
    this.storeStatus = new StoreStatus(false, false, false);

    if (
      localStorage.getItem('access_token') &&
      localStorage.getItem('clinicCode') &&
      localStorage.getItem('clinicId')
    ) {
      this.clinicCode = localStorage.getItem('clinicCode');
      this.clinicId = localStorage.getItem('clinicId'); // preInit would have been called

      // this.getPatientRegistryList();
    } else {
      console.log("can't");
    }

    this.preInit();
  }

  preInit() {
    console.log('Store pre-Init');
    this.storeSuccessCount = 0;
    this.storeFailCount = 0;
    this.storeStatus.hasError = false;
    this.storeStatus.isLoaded = false;
    this.storeStatus.isReseting = true;
    this.isStoreReady.next(this.storeStatus);
    if (this.authService.isAuthenticated()) {
      this.authService.getUser().subscribe(
        res => {
          this.logger.info('USER', res.payload);
          this.user = res.payload;
          localStorage.setItem('roles', JSON.stringify(this.user.roles));
          this.permissionsService.loadPermissions(this.user.roles);
          this.authService.permissionsLoaded = true;
          this.listTemplates();
          this.initStore();
        },
        err => this.alertService.error(JSON.stringify(err))
      );
    }
  }

  ngOnDestroy() {
    this.unsubscribeNotificationPolling();
    this.unsubscribeRegistryPolling();
  }

  initStore() {
    this.authService.isLogout().subscribe(data => {
      this.logoutClearUp();
    });
    this.alertService.getMessage().subscribe(msg => console.log(msg));

    this.apiCmsManagementService.listClinics().subscribe(
      res => {
        console.log('GOT CLINIC LIST');

        if (res.payload) {
          this.clinicList = res.payload;
          // this.clinicclinic = res.payload;
          this.isClinicLoaded.next(res.payload);
          console.log('111 ai ISCLINICLOADED: ', res.payload);
          this.isClinicLoaded.complete();
          this.clinic = this.clinicList.find(clinic => clinic.id === this.clinicId);
          this.setStoreReady(true);
        }
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listClinics'] = err;
        this.setStoreReady(false);
      }
    );

    this.apiCmsManagementService.listVisitPurposes().subscribe(
      res => {
        console.log('GOT VISIT PURPOSE LIST');
        this.visitPurposeList = res.payload;
        this.setStoreReady(true);
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listVisitPurposes'] = err;
        this.setStoreReady(false);
      }
    );
    this.apiCmsManagementService.listDoctors().subscribe(
      res => {
        this.doctorList = res.payload;
        this.setStoreReady(true);
      },
      err => {
        console.log('ERROR IN RETRIEVING DOCTOR LIST,', err);
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listDoctorsByClinic'] = err;
        this.setStoreReady(false);
      }
    );
    this.listDoctorsByClinic();

    this.apiCmsManagementService.listMedicalServices().subscribe(
      res => {
        console.log('GOT MEDICAL SERVICE LIST:', res);
        this.medicalServiceList = res.payload;
        this.medicalServiceListOptions = this.medicalServiceList.map(medicalService => {
          return {
            value: medicalService.id,
            label: medicalService.name
          };
        });
        this.setStoreReady(true);
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listMedicalServices'] = err;
        this.setStoreReady(false);
      }
    );
    this.apiCmsManagementService.listDrugs().subscribe(
      res => {
        console.log('GOT DRUG LIST');
        this.drugList = res.payload.content;
        this.drugListOptions = this.drugList.map(drug => {
          return {
            value: drug.id,
            label: drug.name,
            code: drug.code
          };
        });
        this.setStoreReady(true);
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listDrugs'] = err;
        this.setStoreReady(false);
      }
    );
    this.apiCmsManagementService.listVaccinations().subscribe(
      res => {
        console.log('GOT VACCINATION LIST');
        this.vaccinationList = res.payload.content;
        this.vaccinationListOptions = this.vaccinationList.map(vaccine => {
          return {
            value: vaccine.id,
            label: vaccine.name
          };
        });
        this.setStoreReady(true);
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listVaccinations'] = err;
        this.setStoreReady(false);
      }
    );
    this.apiCmsManagementService.listMedicalTests().subscribe(
      res => {
        console.log('GOT MEDICAL TEST LIST');
        this.medicalTestList = res.payload;
        const set = Array.from(new Set(this.medicalTestList.map(medicalTest => medicalTest.category)));
        this.medicalTestListOptions = set.map(category => {
          return {
            value: category,
            label: category
          };
        });
        this.setStoreReady(true);
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listMedicalTests'] = err;
        this.setStoreReady(false);
      }
    );
    this.apiPatientInfoService.listAllergyGroups().subscribe(
      res => {
        console.log('GOT ALLERGY GROUP LIST');
        this.allergyGroupList = res.payload;
        this.allergyGroupListOptions = this.allergyGroupList.map(allergy => {
          return {
            value: allergy.id,
            label: allergy.groupCode
          };
        });
        this.setStoreReady(true);
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listAllergyGroups'] = err;
        this.setStoreReady(false);
      }
    );
    this.apiCmsManagementService.listSpecialities().subscribe(
      data => {
        if (data.payload) {
          // this.populatePractice(data.payload);
          this.specialitiesList = data.payload;
        }
        this.setStoreReady(true);
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
        this.setStoreReady(false);
      }
    );

    this.apiCmsManagementService.listMedicalCoveragesWithPagination(0, 10000).subscribe(
      res => {
        console.log('GOT MEDICAL COVERAGE LIST');
        console.log('res payload: ', res.payload.content);

        const data = res.payload.content;
        const today = moment().format(DISPLAY_DATE_FORMAT);

        this.medicalCoverageListWithExpired = data;
        // console.log("today: ", today);
        data.forEach(item => {
          const isValid = this.utilsService.validateDates(today, item.endDate);
          if (item.coveragePlans.length !== 0) {
            if (isValid) {
              this.medicalCoverageList.push(item);
            }
          }
        });
        // console.log("med list: ", this.medicalCoverageList);
        // this.medicalCoverageList = res.payload.content;
        this.medicalCoverageList.map(item => {
          return {
            name: item.name,
            coveragePlans: item.coveragePlans.map(plan => plan.name)
          };
        });

        this.setStoreReady(true);
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listMedicalCoveragesWithPagination'] = err;
        this.setStoreReady(false);
      }
    );

    this.apiCmsManagementService.listInstructions().subscribe(
      data => {
        const { payload } = data;
        if (payload) {
          this.instructions = payload['INSTRUCTIONS'] ? payload['INSTRUCTIONS'] : [];
          this.dosageInstructions = payload['DOSAGE_INSTRUCTIONS'] ? payload['DOSAGE_INSTRUCTIONS'] : [];
          this.uoms = payload['UOMS'] ? payload['UOMS'] : [];
          console.log('DOSAGE INSTRUCTIONS', this.instructions, this.dosageInstructions);
        }
        this.setStoreReady(true);
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
        this.setStoreReady(false);
      }
    );


    this.apiCmsManagementService.listChargeItems().subscribe(
      res => {
        console.log('GOT CHARGE ITEM LIST');
        this.chargeItemList = res.payload;
        this.chargeItemListOptions = this.chargeItemList.map(item => {
          return {
            value: item.id,
            label: item.name
            // code: item.code
          };
        });
        this.setStoreReady(true);
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listChargeItems'] = err;
        this.setStoreReady(false);
      }
    );
    
    // this.updatePatientRegistryList();
    this.startHeaderRegistryPolling();
    this.startNotificationPolling();
  }

  listDoctorsByClinic() {
    if (this.clinicId) {
      this.apiCmsManagementService.listDoctorsByClinic(this.clinicId).subscribe(
        res => {
          console.log('GOT DOCTOR LIST');
          this.doctorListByClinic = res.payload;
          this.setStoreReady(true);
        },
        err => {
          console.log('ERROR IN RETRIEVEING DOCTOR LIST,', err);
          this.alertService.error(JSON.stringify(err));
          this.errorMessages['listDoctors'] = err;
          this.setStoreReady(false);
        }
      );
    }
  }

  setStoreReady(hasSucceeded: boolean) {
    if (hasSucceeded) {
      this.storeSuccessCount++;
    } else {
      this.storeFailCount++;
    }

    console.log('isStoreReady Count', this.storeSuccessCount, this.storeFailCount);
    if (this.storeSuccessCount >= 12) {
      this.storeStatus.hasError = false;
      this.storeStatus.isLoaded = true;
      this.storeStatus.isReseting = false;
      this.isStoreReady.next(this.storeStatus);
    } else if (this.storeSuccessCount + this.storeFailCount === 12) {
      this.storeStatus.hasError = true;
      this.storeStatus.isLoaded = true;
      this.storeStatus.isReseting = false;
      this.isStoreReady.next(this.storeStatus);
    }
  }

  startHeaderRegistryPolling() {
    if (!this.registryPolling) {
      this.registryPolling = timer(0, 20000).subscribe(val => {
        this.updatePatientRegistryList();
      });
    }
    // this.registryPolling = timer(1000, 10000);
    // const subscribe = source.subscribe(val => {
    //   console.log(val), this.updatePatientRegistryList();
    // });
  }

  unsubscribeNotificationPolling() {
    if (this.notificationPolling) {
      this.notificationPolling.unsubscribe();
      this.notificationPolling = null;
    }
  }

  startNotificationPolling() {
    if (!this.notificationPolling) {
      this.notificationPolling = timer(1000, 20000).subscribe(val => {
        this.updateNotificationList();
      });
    }
  }

  unsubscribeRegistryPolling() {
    if (this.registryPolling) {
      this.registryPolling.unsubscribe();
      this.registryPolling = null;
    }
  }

  getMedicalCoveragesWithPagination() {
    // this.apiCmsManagementService.listMedicalCoveragesWithPagination(0, 100).subscribe(
    this.apiCmsManagementService.listMedicalCoverages().subscribe(
      res => {
        console.log('GOT MEDICAL COVERAGE LIST---', res.payload.content);
        this.medicalCoverageList = res.payload.content;
        console.log(
          this.medicalCoverageList.map(item => {
            return {
              name: item.name,
              coveragePlans: item.coveragePlans.map(plan => plan.name)
            };
          })
        );
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['getMedicalCoveragesWithPagination'] = err;
      }
    );
  }

  getAuthorizedClinicList() {
    const tempArray = [];

    if (this.user) {
      this.clinicList.map(clinic => {
        clinic.clinicStaffUsernames.forEach(staffUsername => {
          if (staffUsername === this.user.userName) {
            tempArray.push(clinic);
          } else {
            console.log('staff has no access in this clinic: ', clinic);
          }
        });
      });
    }
    this.authorizedClinicList = tempArray;
    return tempArray;
  }

  getAllergyGroupList() {
    this.apiPatientInfoService.listAllergyGroups().subscribe(
      res => {
        console.log('GOT ALLERGY GROUP LIST');
        this.allergyGroupList = res.payload;
        this.allergyGroupListOptions = this.allergyGroupList.map(allergy => {
          return {
            value: allergy.id,
            label: allergy.groupCode
          };
        });
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listAllergyGroups'] = err;
      }
    );
  }

  getVisitPurposeList() {
    this.apiCmsManagementService.listVisitPurposes().subscribe(
      res => {
        console.log('GOT VISIT PURPOSE LIST');
        this.visitPurposeList = res.payload;
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listVisitPurposes'] = err;
      }
    );
  }

  getListOfDoctors() {
    this.apiCmsManagementService.listDoctors().subscribe(
      res => {
        console.log('GOT DOCTOR PURPOSE LIST', res.payload);
        this.doctorList = res.payload;
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.errorMessages['listDoctors'] = err;
      }
    );
  }

  // getListOfDoctorsByClinic() {
  //   this.apiCmsManagementService.listDoctorsByClinic(this.clinicId).subscribe(
  //     res => {
  //       console.log('GOT DOCTOR LIST BY CLINIC: ', res);
  //       this.doctorListByClinic = res.payload;
  //     },
  //     err => {
  //       this.alertService.error(JSON.stringify(err));
  //       this.errorMessages['listDoctors'] = err;
  //     }
  //   );
  // }

  updatePatientRegistryList() {
    if (this.clinicCode) {
      // this.apiPatientVisitService.patientRegistryList(this.clinicCode).subscribe(
      //   data => {
      //     if (data.payload) {
      //       this.patientRegistry = [...data.payload];
      //       this.patientRegistry = data.payload;
      //       this.logger.info('Patient Registry', this.patientRegistry);
      //       this.headerRegistry.next(this.patientRegistry);
      //     }
      //   },
      //   err => this.alertService.error(JSON.stringify(err))
      // );
    }
  }

  listTemplates() {
    if (this.permissionsService.getPermission('ROLE_CONSULTATION_TEMPLATE')) {
      this.apiCmsManagementService.listTemplates(this.getUser().context['cms-user-id']).subscribe(
        res => {
          if (res.payload && res.payload.templates) {
            this.setTemplates(res.payload.templates);
          }
        },
        err => {
          this.alertService.error(JSON.stringify(err));
        }
      );
    }
  }

  findClinic(clinicId: string) {
    return this.clinicList.find(element => element.id === clinicId);
  }

  findDrug(drugCode: string) {
    return this.drugList.find(element => element.code === drugCode);
  }

  findDrugById(drugId: string) {
    return this.drugList.find(element => element.id === drugId);
  }

  getActiveDoctors() {
    return this.doctorList.filter(element => element.status === 'ACTIVE');
  }

  findDoctorById(doctorId: string) {
    return this.doctorList.find(element => element.id === doctorId);
  }

  getUser(): User {
    return this.user;
  }

  getUserId(): string {
    return this.user.context['cms-user-id'];
  }

  getUserLabel(): string {
    return this.user ? this.user.userName.slice(0, 1).toUpperCase() : '';
  }

  getClinicId(): string {
    return this.clinicId;
  }

  getClinic(): Clinic {
    return this.clinicList.find(clinic => clinic.id === this.clinicId);
  }

  getPatientId(): string {
    return this.patientId;
  }

  getPatientVisitRegistryId(): string {
    return this.patientVisitRegistryId;
  }

  getConsultationId(): string {
    return this.consultationId;
  }

  //   getMedicalCoverageList(page: number = 0, size: number = 10000) {
  //     return this.medicalCoverageList.slice(size * page, size * (page + 1));
  //   }

  getPlansByCoverageId(medicalCoverageId: string) {
    // return this.getPlanByCoverageId(this.medicalCoverageList, medicalCoverageId);
    return this.getPlanByCoverageId(this.medicalCoverageListWithExpired, medicalCoverageId);

  }

  getPlanByCoverageId(medicalCoverages, medicalCoverageId: string) {
    return medicalCoverages.filter(elem => elem.id === medicalCoverageId);
  }

  getPlan(medicalCoverageId: string, planId: string) {
    const coverage = this.getPlansByCoverageId(medicalCoverageId);
    if (coverage.length === 0) {
      return {
        id: '0',
        name: 'CASH',
        coveragePlans: [
          {
            id: '0'
          }
        ]
      };
    }
    const plan = this.getPlanFromCoveragesByPlanId(coverage[0].coveragePlans, planId);
    coverage[0].coveragePlans = plan;
    return coverage[0];
  }

  getMedicalCoverages() {
    return this.medicalCoverageList;
  }

  getPlanFromCoveragesByPlanId(plans, planId: string) {
    return plans.filter(elem => elem.id === planId);
  }

  getClinicList(page: number = 0, size: number = 10000) {
    return this.clinicList.slice(size * page, size * (page + 1));
  }

  getDoctorList(page: number = 0, size: number = 10000) {
    if (this.doctorList.length === 0) {
      console.log('GETTING DOCTORS');
      this.getListOfDoctors();
    } else {
      return this.doctorList.slice(size * page, size * (page + 1));
    }
  }

  getMedicalServiceList(page: number = 0, size: number = 10000) {
    return this.medicalServiceList.slice(size * page, size * (page + 1));
  }

  getDrugList(page: number = 0, size: number = 10000) {
    return this.drugList.slice(size * page, size * (page + 1));
  }

  getVacinnationList(page: number = 0, size: number = 10000) {
    return this.vaccinationList.slice(size * page, size * (page + 1));
  }

  getMedicalTestList(page: number = 0, size: number = 10000) {
    return this.medicalTestList.slice(size * page, size * (page + 1));
  }

  getMedicalServiceListOptions() {
    return this.medicalServiceListOptions;
  }

  getDrugListOptions() {
    return this.drugListOptions;
  }

  getVaccinationListOptions() {
    return this.vaccinationListOptions;
  }

  getMedicalTestListOptions() {
    return this.medicalTestListOptions;
  }

  setPatientId(id: string) {
    this.patientId = id;
    this.patientService.resetPatientDetailFormGroup();
  }

  setPatientVisitRegistryId(id: string) {
    this.patientVisitRegistryId = id;
    this.paymentService.resetChargeFormGroup();
    this.paymentService.resetCollectFormGroup();
  }

  setConsultationId(id: string) {
    this.consultationId = id;
    this.paymentService.resetChargeFormGroup();
    this.paymentService.resetCollectFormGroup();
  }

  getNotificationList() {
    return this.notificationList;
  }

  getUnreadNotificationList() {
    return this.unreadNotificationList;
  }

  getIsClinicLoaded(): Observable<any> {
    console.log('111 aisClinic)');
    return this.isClinicLoaded.asObservable();
  }

  resetClinicLoaded() {
    this.isClinicLoaded = new Subject();
  }

  getHeaderRegistry() {
    return this.headerRegistry.asObservable();
  }

  resetHeaderRegistry() {
    this.headerRegistry = new Subject();
  }

  getIsStoreReady(): Observable<any> {
    return this.isStoreReady.asObservable();
  }

  resetIsStoreReady() {
    this.isStoreReady = new Subject();
  }

  updateNotificationList() {
    if (this.authService.isAuthenticated()) {
      this.apiPatientInfoService.listNotifications().subscribe(res => {
        this.notificationList = res.payload;
        this.unreadNotificationList = this.notificationList.filter(notification => !notification.read);
      });
    } else {
      this.unsubscribeNotificationPolling();
    }
  }

  updateUnreadNotificationList() {
    this.unreadNotificationList = this.notificationList.filter(notification => !notification.read);
  }

  logoutClearUp() {
    this.unsubscribeNotificationPolling();
    this.unsubscribeRegistryPolling();
    this.clinicCode = '';
    this.clinicId = '';
    this.router.navigate(['login']);
    this.storeSuccessCount = 0;
  }

  getTemplates() {
    return this.templates;
  }

  setTemplates(templates) {
    this.templates = templates;
  }

  getInstructions(): Array<Instruction> {
    return this.instructions;
  }
  getDosageInstructions(): Array<DosageInstruction> {
    return this.dosageInstructions;
  }

  getCaseId(): string {
    return this._caseId;
  }
  setCaseId(value: string) {
    this._caseId = value;
  }
}
