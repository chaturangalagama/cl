import { PatientAddQueueConfirmationComponent } from './../../../../components/patient-add/patient-add-queue-confirmation/patient-add-queue-confirmation.component';
import { ApiPatientVisitService } from './../../../../services/api-patient-visit.service';
import { VisitPurpose, PatientVisit } from './../../../../objects/request/PatientVisit';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { StoreService } from './../../../../services/store.service';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { distinctUntilChanged, debounceTime, filter, switchMap, map } from 'rxjs/operators';
import { FormControl, FormBuilder } from '@angular/forms';

import { ApiPatientInfoService } from '../../../../services/api-patient-info.service';
import { AttachedMedicalCoverage } from '../../../../objects/AttachedMedicalCoverage';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-patient-search',
  templateUrl: './patient-search.component.html',
  styleUrls: ['./patient-search.component.scss']
})
export class PatientSearchComponent implements OnInit {
  searchField: FormControl;
  rows = [];

  currPatientId: string;
  confirmationBsModalRef: BsModalRef;

  temp = [];
  constructor(
    private apiPatientInfoService: ApiPatientInfoService,
    private apiPatientVisitService: ApiPatientVisitService,
    private route: ActivatedRoute,
    private router: Router,
    private store: StoreService,
    private alertService: AlertService,
    private modalService: BsModalService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.searchField = new FormControl();
    this.searchField.valueChanges
      .pipe(filter(term => {
        this.rows = [];
        //Filter and stop firing API if only one special char is inputted
        if (term.match(/[^a-zA-Z0-9 ]/g)) {
          const str = term.replace(/[^a-zA-Z0-9 ]/g, '');
          if (str.length < 1) {
            this.searchField.setValue(str);
            return false
          }
        }
        return term;
      }), distinctUntilChanged(), map(data => {
        // remove special char for API call
        data = data.replace(/[^a-zA-Z0-9 ]/g, '');
        this.searchField.setValue(data);
        return data
      }), debounceTime(400), switchMap(term => this.apiPatientInfoService.search(term)))
      .subscribe(
        data => {
          console.log('DATA', data);
          if (data) {
            const { payload } = data;
            const temp2 = payload.map(payload => {
              const d = {
                name: payload.name,
                phone: payload.contactNumber.number,
                dob: payload.dob,
                id: payload.userId.number,
                patientid: payload.id
              };
              return d;
              // return payload.name;
            });
            // push our inital complete list
            this.rows = temp2;
          }
          return data;
        },
        err => {
          this.alertService.error(JSON.stringify(err.error.message));
        }
      );
  }

  onSelect(event) {
    console.log(event);
    this.store.setPatientId(event.selected[0].patientid);
    this.router.navigate(['pages/patient/detail']);
  }

  toPatientDetail(patientId) {
    this.store.setPatientId(patientId);
    this.router.navigate(['pages/patient/detail']);
  }

  onAddToQueue(id) {
    this.store.setPatientId(id);
    this.apiPatientVisitService.getPatientVisitHistory(this.store.getPatientId()).subscribe(res => {
      const outstandingPayment = res.payload
        .map(history => history.billPayment || { paymentStatus: '' })
        .filter(payment => payment.paymentStatus === 'PENDING_PAYMENT_CONFIRMATION');
      if (outstandingPayment.length > 0) {
        alert('This patient has outstanding payment.');
      }
      this.showAddConfirmation(id);
    });
  }

  onAddNewPatient() {
    this.router.navigate(['pages/patient/add']);
  }

  showAddConfirmation(patientId) {
    this.currPatientId = patientId;
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
        console.log('Patient Serach Data', data);
        this.addPatientToRegistry(patientId, data);
      } else {
        console.log('No data emitted');
      }
      this.confirmationBsModalRef.content.event.unsubscribe();
      this.confirmationBsModalRef.hide();
    });
  }

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
          this.router.navigate(['pages/patient']);
        }
      },
      err => {
        console.log('Error occured', err);
      }
    );
  }
}
