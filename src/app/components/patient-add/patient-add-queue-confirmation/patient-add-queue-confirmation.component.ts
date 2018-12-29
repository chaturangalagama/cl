import { AlertService } from './../../../services/alert.service';
import { MedicalCoverageResponse } from './../../../objects/response/MedicalCoverageResponse';
import { ApiPatientInfoService } from './../../../services/api-patient-info.service';
import { StoreService } from './../../../services/store.service';
import { SelectedPlans } from './../../../objects/MedicalCoverage';
import { SelectedItem } from './../../../views/components/medical-coverage/assign-medical-coverage/assign-medical-coverage.component';
import { PatientService } from './../../../services/patient.service';
import { Component, OnInit, Input, ElementRef, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { DatePipe } from '@angular/common';
import { AttachedMedicalCoverage } from '../../../objects/AttachedMedicalCoverage';
import * as moment from 'moment';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-patient-add-queue-confirmation',
  templateUrl: './patient-add-queue-confirmation.component.html',
  styleUrls: ['./patient-add-queue-confirmation.component.scss']
})
export class PatientAddQueueConfirmationComponent implements OnInit {
  @Input() confirmationFormGroup: FormGroup;
  @Output() updateChange = new EventEmitter<Array<AttachedMedicalCoverage>>();
  // @Input() selectedCoverages: Array<AttachedMedicalCoverage>;
  selectedCoverages: FormGroup;

  bsModalRef: BsModalRef;
  confirmationInput: SelectedItem[];
  consultationFormGroup: FormGroup;
  patientAddFormGroup: FormGroup;
  medicalCoverageSummaryFormGroup: FormGroup;
  selectedItems: SelectedItem[] = [];
  public event: EventEmitter<any> = new EventEmitter();

  // selectedPlans: Array<Coverage>;

  // Input Data
  title: string;
  type: string; // UNDEFINED || ATTACH_MEDICAL_COVERAGE
  // Input Data
  selectedPlans: SelectedPlans[];
  coverages: MedicalCoverageResponse;

  // DATA BINDING
  consultationInfo = {
    preferredDoctor: '',
    remarks: '',
    purposeOfVisit: '',
    visitDate: '',
    time: '',
    attachedMedicalCoverages: ''
  };
  visitDate: Date;
  time: string;
  preferredDoctor: string;
  remarks: string;
  purposeOfVisit: string;
  hasUpdatePriority: boolean;

  indexesOfCheckedPlans = [];

  constructor(
    private modalService: BsModalService,
    private patientService: PatientService,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private eRef: ElementRef,
    private store: StoreService,
    private apiPatientInfoService: ApiPatientInfoService,
    private alertService: AlertService
  ) {


    this.selectedCoverages = this.fb.group([]);

  }

  onBtnSaveClicked($event) {
    const cleanedData = this.checkissuedMedicalTest(this.consultationInfo);
    this.event.emit(cleanedData);
  }

  onBtnCloseClicked($event) {
    // const cleanedData = this.checkissuedMedicalTest(this.consultationInfo);
    this.event.emit('Close');
  }

  ngOnInit() {

    if (this.selectedCoverages) {
      console.log("selected: ", this.selectedCoverages);
      /// TO DO: CHECK TO SEE WHETHER THIS.SELECTEDCOVERAGES IS BEING PASSED INTO MEDICAL COVERAGE COMPONENT 
    } else {
      this.selectedCoverages = this.fb.group([]);
    }
    // this.patientAddFormGroup = this.patientService.getPatientAddFormGroup();
    this.consultationFormGroup = this.createConsultationPage();
    this.medicalCoverageSummaryFormGroup = this.createMedicalCoverageFormGroup();
    this.confirmationFormGroup = this.createConfirmationFormGroup();
    this.subscribeToValueChanges();

    if (!this.selectedPlans) {
      this.apiPatientInfoService.searchBy('systemuserid', this.store.getPatientId()).subscribe(
        res => {
          const patientInfo = res.payload;

          this.apiPatientInfoService.searchAssignedPoliciesByUserId(patientInfo['userId']).subscribe(
            value => {
              if (value.payload) {
                this.coverages = new MedicalCoverageResponse(
                  value.payload.INSURANCE,
                  value.payload.CORPORATE,
                  value.payload.CHAS,
                  value.payload.MEDISAVE
                );

                // this.selectedPlans = this.coverages;
                this.medicalCoverageSummaryFormGroup.get('patientCoverages').patchValue(this.coverages);
                // console.log("THIS MEDICAL SUMMARY: ", this.medicalCoverageSummaryFormGroup);
              }
            },
            err => {
              this.alertService.error(JSON.stringify(err.error.message));
            }
          );
        },
        err => {
          this.alertService.error(JSON.stringify(err.error.message));
        }
      );
    }
  }

  createConfirmationFormGroup(): FormGroup {
    return this.fb.group({
      selectedItems: ''
    });
  }

  subscribeToValueChanges() {
    this.consultationFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        console.log('CONSULTATION FORM:', values);
        this.visitDate = values.visitDate;
        this.time = moment(values.time).format('MM-DD-YYYY');
        this.purposeOfVisit = values.purposeOfVisit;
        this.remarks = values.remarks;
        this.preferredDoctor = values.preferredDoctor;
        this.consultationInfo.purposeOfVisit = values.purposeOfVisit;
        this.consultationInfo.remarks = values.remarks;
        this.consultationInfo.preferredDoctor = values.preferredDoctor;
        console.log('consultation info:', this.consultationInfo);

        console.log(this.preferredDoctor);
      });

    this.medicalCoverageSummaryFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        console.log('MEDICAL COVERAGE FORM:', values);
        // this.consultationInfo.attachedMedicalCoverages = values.attachedMedicalCoverages;
        this.consultationInfo.attachedMedicalCoverages = values.attachedMedicalCoverages;

      });
  }

  createConsultationPage(): FormGroup {
    console.log('returning Consultation Page Form');
    return this.fb.group({
      visitDate: new FormControl(),
      time: '', // '930',
      preferredDoctor: '', // ['', Validators.required], // ,
      purposeOfVisit: '', // ['', Validators.required], // ,
      remarks: '' // ['', Validators.required] // ,
    });
  }

  createMedicalCoverageFormGroup(): FormGroup {
    // console.log('returning MedicalCoverage Page Form');
    return this.fb.group({
      attachedMedicalCoverages: this.addMedicalCoverageForm(),
      patientCoverages: ''
    });
  }

  addMedicalCoverageForm() {
    const medicalCoverage = this.fb.group({
      coverageId: '',
      medicalCoverageId: '',
      planId: ''
    });

    return new FormArray([medicalCoverage]);
  }

  checkissuedMedicalTest(data) {
    // const attachedMedicalCoverages = data.attachedMedicalCoverages;
    const attachedMedicalCoverages = this.selectedCoverages.value;

    console.log('ATTACHED ARE: ', attachedMedicalCoverages);
    if (attachedMedicalCoverages) {
      const newAttachedMedicalCoverages = attachedMedicalCoverages.filter(
        value =>
          null !== value.coverageId &&
          value.coverageId !== '' &&
          null !== value.planId &&
          value.planId !== '' &&
          null !== value.medicalCoverageId &&
          value.medicalCoverageId !== ''
      );

      data.attachedMedicalCoverages = newAttachedMedicalCoverages;
    }

    return data;
  }

  hideConsultationInfo() {
    if (this.type === 'ATTACH_MEDICAL_COVERAGE' || this.type === 'DISPLAY_MEDICAL_COVERAGE') {
      return true
    }
    return false
  }
}
