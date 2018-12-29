import { Doctor } from './../../../../objects/SpecialityByClinic';
import { FormBuilder } from '@angular/forms';
import { PatientAddQueueConfirmationComponent } from './../../../../components/patient-add/patient-add-queue-confirmation/patient-add-queue-confirmation.component';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatatableComponent, ColumnMode } from '@swimlane/ngx-datatable';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { NgxPermissionsService } from 'ngx-permissions';

import { ApiPatientVisitService } from '../../../../services/api-patient-visit.service';
import { VitalSignComponent } from './../../../../components/consultation/vital/vital-sign/vital-sign.component';
import { AlertService } from './../../../../services/alert.service';
import { ConsultationFormService } from './../../../../services/consultation-form.service';
import { LoggerService } from './../../../../services/logger.service';
import { StoreService } from './../../../../services/store.service';
import { AuthService } from '../../../../services/auth.service';
import { PaymentService } from './../../../../services/payment.service';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss']
})
export class PatientListComponent implements OnInit {
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableWrapper') tableWrapper;
  @ViewChild('containerFluid') container;
  private currentComponentWidth;

  rows = [];
  columns = [
    { name: 'Number', prop: 'number', flexGrow: 1 }, // Let display name be #
    { name: 'Visit no', prop: 'visitno', flexGrow: 2 },
    { name: 'Name', flexGrow: 2 },
    { name: 'NRIC', flexGrow: 2 },
    { name: 'Time', flexGrow: 1 },
    { name: 'Doctor', flexGrow: 2 },
    { name: 'Purpose', flexGrow: 3 },
    { name: 'Remarks', flexGrow: 1 },
    { name: 'Status', flexGrow: 1 },
    { name: 'Action', flexGrow: 1 },
    { name: 't', prop: 'patientid', flexGrow: 0 },
    { name: 't', prop: 'patientRegistryId', flexGrow: 0 },
    { name: 't', prop: 'consultationId', flexGrow: 0 }
  ];

  temp2 = [];
  filterOptions = [];
  pageLimit = 25;

  error: string;

  // Field dropdown options
  numberOfEntriesDropdown = {
    value: [
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      {
        value: '100',
        label: '100'
      }
    ]
  };

  statusFilterDropdown = {
    value: [
      { value: 'ALL', label: 'ALL' },
      { value: 'INITIAL', label: 'INITIAL' },
      { value: 'CONSULT', label: 'CONSULT' },
      {
        value: 'POST_CONSULT',
        label: 'POST CONSULT'
      },
      {
        value: 'PAYMENT',
        label: 'PAYMENT'
      },
      {
        value: 'COMPLETE',
        label: 'COMPLETE'
      }
    ]
  };

  doctorsFilterDropdown = { value: [] };

  actionList = ['Vital Signs', 'Update Visit Details'];
  selectedAction: string;

  bsModalRef: BsModalRef;
  confirmationBsModalRef: BsModalRef;

  constructor(
    private permissionsService: NgxPermissionsService,
    private router: Router,
    private store: StoreService,
    private apiPatientVisitService: ApiPatientVisitService,
    private alertService: AlertService,
    private eRef: ElementRef,
    private logger: LoggerService,
    private modalService: BsModalService,
    private consultationFormService: ConsultationFormService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    if (
      localStorage.getItem('access_token') &&
      localStorage.getItem('clinicCode') &&
      localStorage.getItem('clinicId')
    ) {
      this.store.clinicCode = localStorage.getItem('clinicCode');
      this.store.clinicId = localStorage.getItem('clinicId');
    } else {
      alert('Clinic is not selected.');
      localStorage.removeItem('access_token');
      this.authService.logout();

      console.log('Access Denied');
      // this.router.navigate(['login']);
    }

    if (this.store.errorMessages.length > 0) {
      this.store.errorMessages.forEach(errorMsg1 => {
        console.log('ERROR MESSAGE: ', errorMsg1);
      });
    }
    this.getPatientRegistryList();
    this.store.getHeaderRegistry().subscribe(res => {
      if (this.permissionsService.getPermission('ROLE_DOCTOR') && !this.permissionsService.getPermission('ROLE_CA')) {
        console.log('Populate Doctor View');
        this.populateDocData(null);
      } else {
        // this.rows = this.temp2;
        this.populateData(null);
      }
    });
  }

  ngAfterViewChecked() {
    const bodyClassList = document.querySelector('body').classList;

    if (
      bodyClassList.contains('sidebar-hidden') ||
      bodyClassList.contains('asidemenu-hidden') ||
      bodyClassList.contains('sidebar-minimized') ||
      bodyClassList.contains('brand-minimized')
    ) {
      // this.currentComponentWidth = this.container.nativeElement.clientWidth;
      this.table.columnMode = ColumnMode.force;
      this.table.recalculate();
      const evt = window.document.createEvent('UIEvents');
      evt.initUIEvent('click', true, false, window, 0);
      window.dispatchEvent(evt);

      // console.log('this.table: ', this.table);
    } else {
      this.table.columnMode = ColumnMode.flex;
      const evt = window.document.createEvent('UIEvents');
      evt.initUIEvent('click', true, false, window, 0);
      window.dispatchEvent(evt);

      this.table.recalculate();
    }
  }

  toggleExpandRow(row) {
    console.log('Toggled Expand Row!', row);
    this.table.rowDetail.toggleExpandRow(row);
  }

  getPatientRegistryList() {
    this.apiPatientVisitService.patientRegistryList(this.store.clinicCode).subscribe(
      data => {
        if (data) {
          const { payload } = data;
          // check user role, if only doctor then sort data based on 'consultation' then 'initial'
          if (
            this.permissionsService.getPermission('ROLE_DOCTOR') &&
            !this.permissionsService.getPermission('ROLE_CA')
          ) {
            console.log('Populate Doctor View');
            this.populateDocData(payload);
          } else {
            // this.rows = this.temp2;
            this.populateData(payload);
          }

          this.doctorsFilterDropdown.value = this.getDoctorsOnDuty();
        }
        return data;
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );
  }

  populateData(data) {
    if (
      (this.store.patientRegistry && JSON.stringify(this.store.patientRegistry) !== JSON.stringify(this.rows)) ||
      data
    ) {
      let dataToBeProcess = [];
      if (data) {
        dataToBeProcess = data;
      } else {
        dataToBeProcess = this.store.patientRegistry;
      }

      this.temp2 = dataToBeProcess.map((payload, index) => {
        const doctor = this.store.doctorList ? this.store.doctorList.find(x => {
          if (x.id === payload.doctorId) { return x; }
        }) : '';

        const d = doctor ? doctor.displayName : '';
        // console.log("DOCTOR: ", d);
        const tempPatient = {
          action: payload.action,
          patientid: payload.patientId,
          patientRegistryId: payload.patientRegistryId,
          consultationId: payload.consultationId,
          status: payload.visitState,
          number: index + 1,
          visitNumber: payload.visitNumber,
          name: payload.name,
          nric: payload.userId['number'],
          time: payload.visitStartTime,
          // doctor: payload.doctorsName,
          doctor: d,
          purpose: payload.purposeOfVisit,
          remarks: payload.remark
        }; // TODO: Map corresponding doctor name
        return tempPatient;
      });
      this.rows = this.temp2;
      this.doctorsFilterDropdown.value =
        this.store.patientRegistry && this.getDoctorsOnDuty();
    }
    // return payload;
  }

  populateDocData(data) {
    if (
      (this.store.patientRegistry && JSON.stringify(this.store.patientRegistry) !== JSON.stringify(this.rows)) ||
      data
    ) {
      const initialState = [];
      const consultState = [];
      const otherState = [];
      let dataToBeProcess = [];
      if (data) {
        dataToBeProcess = data;
      } else {
        dataToBeProcess = this.store.patientRegistry;
      }

      dataToBeProcess.map((payload, index) => {
        const tempPatient = {
          action: payload.action,
          patientid: payload.patientId,
          patientRegistryId: payload.patientRegistryId,
          consultationId: payload.consultationId,
          status: payload.visitState,
          number: index + 1,
          visitNumber: payload.visitNumber,
          name: payload.name,
          nric: payload.userId['number'],
          time: payload.visitStartTime,
          doctor: payload.doctorsName,
          purpose: payload.purposeOfVisit,
          remarks: payload.remark
        };

        if (payload.visitState === 'INITIAL') {
          initialState.push(tempPatient);
        } else if (payload.visitState === 'CONSULT') {
          consultState.push(tempPatient);
        } else {
          otherState.push(tempPatient);
        }
      });

      this.rows = consultState.concat(initialState.concat(otherState));
      this.temp2 = this.rows;
    }
  }

  getDoctorsOnDuty() {
    const doctorMap = this.store.doctorList
      .reduce((map, obj) => {
        map[obj.id] = obj.displayName;
        return map;
      }, {});

    console.log("DOCTOR MAP", doctorMap);

    return this.store.clinic.attendingDoctorId
      .reduce((optionArray, doctorId) => {
        console.log("doctorId", doctorId);
        if (doctorMap[doctorId]) {
          optionArray.push({ value: doctorMap[doctorId], label: doctorMap[doctorId] });
        }
        return optionArray;
      }, [{ value: 'ALL', label: 'ALL' }]);
  }

  addPatient() {
    this.router.navigate(['pages/patient/search']);
  }

  patientRegistryExpand() {
    const bodyClassList = document.querySelector('body').classList;

    if (
      bodyClassList.contains('sidebar-hidden') ||
      bodyClassList.contains('asidemenu-hidden') ||
      bodyClassList.contains('sidebar-minimized') ||
      bodyClassList.contains('brand-minimized')
    ) {
      // window.dispatchEvent(new Event('resize'));
      return 'force';
    } else {
      return 'flex';
    }
  }

  getRowClass(row) {
    switch (row.status) {
      case 'INITIAL':
      case 'PRECONSULT':
      case 'CONSULT':
      case 'PAYMENT':
      case 'POST_CONSULT':
        return 'row-active';

      case 'COMPLETE':
        return 'row-inactive';

      default:
        return 'row-active';
    }
  }

  onShowExtraClicked() {
    const ref = this.eRef.nativeElement.querySelector('popoverbtn');
    if (ref) {
      ref.hide();
    }
  }

  getStatusColor(value) {
    switch (value) {
      case 'INITIAL': // Initial use for testing : replace value with value to test
        return 'consultation pre';
      case 'PRECONSULT':
        return 'consultation pre';
      case 'CONSULT':
        return 'consultation consult';
      case 'PAYMENT':
        return 'consultation payment';
      case 'POST_CONSULT':
        return 'consultation post';
      case 'COMPLETE':
        return 'consultation completed';

      default:
        return 'row-active';
    }
  }

  checkPermission(status) {
    // console.log('status: ', status);
    switch (status) {
      case 'INITIAL':
      // case 'PRECONSULT':
      case 'CONSULT':
        return !this.permissionsService.getPermission('ROLE_DOCTOR');

      case 'POST_CONSULT':
      case 'PAYMENT':
        return !this.permissionsService.getPermission('ROLE_CA');

      case 'COMPLETE':
      default:
        return false;
    } // when user has no access, this returns undefined. set to buttonIsDisabled = true
  }

  buttonIsDisabled(status) {
    const hasNoAccess = this.checkPermission(status);
    const buttonStyle = 'btn btn-sm btn-link font-weight-semi-bold pt-0 ';
    if (hasNoAccess) {
      return buttonStyle + 'disabled';
    } else {
      return buttonStyle;
    }
  }

  filterSearch(filterArray, index, data) {
    const filterKey = filterArray[index];

    if (index > -1) {
      data = data.filter(function (d) {
        if (d[filterKey.key] !== undefined) {
          if (filterKey.key === 'status') {
            return d[filterKey.key].indexOf(filterKey.value) === 0 || !filterKey.value;
          } else if (filterKey.key === 'name') {
            return d[filterKey.key].toLowerCase().indexOf(filterKey.value.toLowerCase()) !== -1 || !filterKey.value;
          } else {
            return d[filterKey.key].indexOf(filterKey.value) !== -1 || !filterKey.value;
          }
        }
      });
      return this.filterSearch(filterArray, index - 1, data);
    }
    return data;
  }

  setFilterValue(event: any, searchKey) {
    console.log('event: ', event);
    console.log('searchKey: ', searchKey);

    switch (searchKey) {
      case 'name':
        return event.target.value.toLowerCase();
      case 'doctor':
      case 'status':
        return event.value;
      default:
        return event;
    }
  }

  updateFilter(event: any, searchKey) {
    const val = this.setFilterValue(event, searchKey);
    const keyAlreadySelected = this.filterOptions.some(function (v) {
      return v.key === searchKey;
    });
    const index = this.filterOptions.findIndex(x => x.key === searchKey);

    if (val !== undefined) {
      if (val !== 'ALL') {
        if (keyAlreadySelected) {
          this.filterOptions[index].value = val;
        } else {
          this.filterOptions.push({ key: searchKey, value: val });
        }
      } else {
        if (keyAlreadySelected) {
          this.popFilter(index);
        }
      }
    }

    this.rows = this.filterSearch(this.filterOptions, this.filterOptions.length - 1, this.temp2);
  }

  popFilter(index) {
    this.filterOptions.splice(index, index + 1);
  }

  updateFilterByStatus(event) {
    const val = event.target.value;

    // Filter data
    const temp = this.temp2.filter(function (d) {
      return d.status.indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.rows = temp;
    // Whenever the filter changes, always go back to the first page
  }

  redirectToPatientDetail(patientId: string, name: string) {
    // this.cmsManagementService.setPatientId(patientId);
    this.store.setPatientId(patientId);
    this.router.navigate(['/pages/patient/detail']);
    return false;
  }

  populateEntries(event) {
    this.pageLimit = event.value;
  }

  redirectToNextPage(value: string, patientId: string, patientRegistryId: string, consultationId: string) {
    this.store.setPatientId(patientId);
    this.store.setPatientVisitRegistryId(patientRegistryId);
    this.store.setConsultationId(consultationId);

    switch (value) {
      case 'INITIAL':
        // change to pre consult
        this.apiPatientVisitService.consult(patientRegistryId).subscribe(
          resp => {
            if (resp.statusCode === 'S0000') {
              // alert('Status changed successfully.');
              // window.location.reload();
              // reload data table
              this.getPatientRegistryList();
            } else {
              alert(resp.message);
            }
          },
          err => {
            this.alertService.error(JSON.stringify(err.error.message));
            alert(err.error.message);
          }
        );
        return null;
      case 'PRECONSULT':
        // change to consult
        // redirect to consultation
        return null;
      case 'CONSULT':
        // Do Nothing, if doc go to consultation
        this.router.navigate(['/pages/consultation/add']);

        return null;
      case 'PAYMENT':
        // go to payment page 2
        // 'payment/collect'
        this.paymentService.setConsultationInfo(null);
        this.router.navigate(['/pages/payment/collect']);
        return null;
      case 'POST_CONSULT':
        // 'payment/charge'
        // go to payment page 1
        this.router.navigate(['/pages/payment/charge']);
        return null;
      case 'COMPLETE':
        // do nothing
        this.router.navigate(['/pages/patient/detail'], {
          queryParams: { tabIndex: 1 }
        });
        return null;

      default:
        return null;
    }
  }

  btnActionProceed(row) {
    this.logger.info('Proceed Action Pressed', row.patientid, this.selectedAction);
    switch (this.selectedAction) {
      case this.actionList[0]:
        this.showAddVitalSigns(row.patientid);
        break;
      case this.actionList[1]:
        // Show change medical coverage
        this.showUpdateMedicalCoverage(row);
        break;
      default:
        break;
    }
    this.selectedAction = '';
  }

  showAddVitalSigns(patientid: string) {
    const initialState = {
      isModal: true,
      patientId: patientid,
      vitalForm: this.consultationFormService.generateVitalForm(),
      title: 'Vital Sign'
    };

    const customClass = { class: 'container' };

    this.bsModalRef = this.modalService.show(VitalSignComponent, { initialState });
    this.bsModalRef.content.closeBtnName = 'Close';
  }

  showUpdateMedicalCoverage(row) {
    this.apiPatientVisitService.patientVisitSearch(row.patientRegistryId).subscribe(
      res => {
        const {
          payload: {
            patientVisitRegistry: { attachedMedicalCoverages }
          }
        } = res;

        console.log('ATTACHED MEDICAL COVERAGES: ', attachedMedicalCoverages);
        this.proceedToUpdateMedicalCoverage(row.patientid, row.patientRegistryId, attachedMedicalCoverages);
      },
      err => {
        this.alertService.error(JSON.stringify(err));
        this.proceedToUpdateMedicalCoverage(row.patientid, row.patientRegistryId, []);
      }
    );
  }

  proceedToUpdateMedicalCoverage(patientId: string, patientRegistryId: string, attachedMedicalCoverages: any[]) {
    // this.currPatientId = patientId;
    this.store.setPatientId(patientId);
    const selectedMC = this.fb.array(attachedMedicalCoverages);


    console.log("selectedMC: ", selectedMC);
    const initialState = {
      title: 'Update Medical Coverage',
      type: 'ATTACH_MEDICAL_COVERAGE',
      selectedCoverages: selectedMC
    };

    this.confirmationBsModalRef = this.modalService.show(PatientAddQueueConfirmationComponent, {
      initialState,
      class: 'modal-lg'
    });

    this.confirmationBsModalRef.content.event.subscribe(data => {
      if (data) {
        // Patient Visit Attach Medical Coverage
        this.apiPatientVisitService.attachMedicalCoverage(patientRegistryId, data.attachedMedicalCoverages).subscribe(
          res => {
            this.confirmationBsModalRef.content.event.unsubscribe();
            this.confirmationBsModalRef.hide();
            this.store.setPatientId('');
          },
          err => {
            this.alertService.error(JSON.stringify(err));
          }
        );
      } else {
        console.log('No data emitted');
      }
    });
  }

  preventClose(event: MouseEvent) {
    event.stopImmediatePropagation();
  }
}
