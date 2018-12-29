import { DrugItem } from './../../../objects/DrugItem';
import { PrintTemplateService } from './../../../services/print-template.service';
import { Doctor } from './../../../objects/SpecialityByClinic';
import { Clinic } from './../../../objects/response/Clinic';
import { externalReferralDetails } from './../../../objects/request/PatientReferral';
import { Component, OnInit, Input, HostListener } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { IOption } from 'ng-select';
import { DISPLAY_DATE_FORMAT, DB_FULL_DATE_FORMAT, MC_HALFDAY_OPTIONS } from '../../../constants/app.constants';

import { StoreService } from '../../../services/store.service';
import { AlertService } from '../../../services/alert.service';
import { ApiCmsManagementService } from '../../../services/api-cms-management.service';
import { NgxPermissionsService } from 'ngx-permissions';

import { drugLabelTemplate } from '../../../views/templates/drug.label';
import { patientLabelTemplate } from '../../../views/templates/patient.label';
import { medicalCertificateTemplate } from '../../../views/templates/medical.certificate';
import { refferalLetterTemplate } from '../../../views/templates/refferal.letter';
import { memoTemplate } from '../../../views/templates/memo';
import { timeChitTemplate } from '../../../views/templates/time.chit';
import * as moment from 'moment';
import { vaccinationCertificateTemplate } from '../../../views/templates/vaccination.certificate';
import { UtilsService } from '../../../services/utils.service';
@Component({
  selector: 'app-payment-print',
  templateUrl: './payment-print.component.html',
  styleUrls: ['./payment-print.component.scss']
})
export class PaymentPrintComponent implements OnInit {
  @Input() chargeFormGroup: FormGroup;
  @Input() patientInfo;
  @Input() consultationInfo;
  printFormGroup: FormGroup;

  constructor(
    private store: StoreService,
    private alertService: AlertService,
    private apiCmsManagementService: ApiCmsManagementService,
    private permissionsService: NgxPermissionsService,
    private printTemplateService: PrintTemplateService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.printFormGroup = this.chargeFormGroup.get('printFormGroup') as FormGroup;
  }

  printTemplate(template: string) {
    const w = window.open();
    w.document.open();
    w.document.write(template);
    w.document.close();
    console.log('document closed');
    w.onload = () => {
      console.log('window loaded');
      w.window.print();
    };
    w.onafterprint = () => {
      w.close();
    };
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    console.log('event: ', event);
    switch (event.keyCode) {
      case 118:
        console.log('F7');
        this.onBtnPrintLabelClicked();
        break;
      case 119:
        console.log('F8');
        this.onBtnPrintMCClicked();
        break;
      case 120:
        console.log('F9');
        this.onBtnPrintPatientLabelClicked();
        break;
    }
  }

  onBtnPrintSlipClicked() {
    console.log('Print Prescription Slip');
  }

  appendFullStop(str: string) {
    if (str.charAt(str.length - 1) !== '.') {
      return str + '.';
    } else {
      return str;
    }
  }

  onBtnPrintLabelClicked() {
    this.apiCmsManagementService.searchLabel('DRUG_LABEL').subscribe(
      res => {
        const template = JSON.parse(res.payload.template);

        const patient = this.patientInfo;
        const clinic = this.store.getClinicList().find(clinic => clinic.id === this.store.getClinicId());
        const prescriptionFormGroup = this.chargeFormGroup.get('prescriptionFormGroup');
        const drugArray = prescriptionFormGroup.get('drugArray').value;
        const drugs = this.consultationInfo.drugDispatch.dispatchDrugDetail;

        const w = window.open();
        w.document.open();
        console.log('clinic: ');
        drugs.forEach((drug, index) => {
          if (drugArray[index] && drugArray[index].checkbox) {
            console.log('DRUG:  ', drug);
            const drugItem: DrugItem = this.store.findDrugById(drug.drugId);
            let drugCautionary = '';
            console.log('drug cautionary', drugItem);
            if (drugItem) {
              drugItem.cautionary.forEach(element => {
                drugCautionary += element + ' ';
              });
            } else {
              drugCautionary = drug.instruction.cautionary
                ? this.appendFullStop(drug.instruction.cautionary.join('\n'))
                : '';
            }

            // const drugCautionary = drug.cautionary ? this.appendFullStop(drug.cautionary.join('\n')) : '';
            const drugRemark = drug.remark ? this.appendFullStop(drug.remark) : '';
            let drugInstruction = '';
            if (drug.dosageInstruction && drug.dosageInstruction.instruct) {
              drugInstruction = drug.dosageInstruction.instruct.includes('#')
                ? drug.dosageInstruction.instruct.replace('#', drug.dose.quantity) +
                  ' ' +
                  drug.instruction.instruct.toLowerCase()
                : drug.dosageInstruction.instruct + ' ' + drug.instruction.instruct.toLowerCase();
            } else {
              drugInstruction = drug.instruction.instruct
                ? this.appendFullStop(drug.instruction.instruct.toLowerCase())
                : '';
            }
            // drugInstruction += ' ' + drug.instruction.instruct;

            const html = template
              .replace(
                '{{clinicAddress}}',
                `${clinic.address.address.toUpperCase() || ''}, SINGAPORE ${clinic.address.postalCode}`
              )
              .replace('{{clinicTel}}', clinic.contactNumber)
              .replace('{{clinicFax}}', clinic.faxNumber)
              .replace('{{drugName}}', drug.name)
              .replace('{{drugQuantity}}', `${drug.quantity} ${drug.dose.uom}`.toUpperCase())
              .replace('{{drugBatchNo}}', drug.batchNumber)
              .replace('{{drugExpiryDate}}', drug.expiryDate)
              // .replace('{{drugDosage}}', `${drug.dose.quantity} ${drug.dose.uom}`.toLowerCase())
              .replace('{{drugDosage}}', '')
              .replace('{{drugFreqPerDay}}', drug.instruction.frequencyPerDay)
              .replace('{{drugCautionary}}', drugCautionary)
              .replace('{{drugInstruction}}', drugInstruction)
              .replace('{{drugRemarks}}', drugRemark)
              .replace('{{patientId}}', patient.patientNumber || '-')
              .replace('{{patientName}}', patient.name.toUpperCase())
              .replace('{{visitDate}}', moment().format(DISPLAY_DATE_FORMAT));
            w.document.write(html);
          }
        });

        w.document.close();
        w.onload = () => {
          w.window.print();
        };
        w.onafterprint = () => {
          w.close();
        };
      },
      err => this.alertService.error(JSON.stringify(err.error['message']))
    );
  }

  onBtnPrintMCClicked() {
    this.apiCmsManagementService.searchLabel('MEDICAL_CERTIFICATE').subscribe(
      res => {
        const template = JSON.parse(res.payload.template);
        const consultation = this.consultationInfo;
        const patient = this.patientInfo;
        const clinic = this.store.getClinicList().find(clinic => clinic.id === this.store.getClinicId());
        const medicalCertificates = this.printFormGroup.get('medicalCertificateArray').value;
        const diagnosisArray = this.chargeFormGroup.get('diagnosisFormGroup').get('diagnosisArray') as FormArray;
        const diagnosis = diagnosisArray.getRawValue();

        const consultDoctor = this.store.getDoctorList().find(doctor => doctor.id === consultation.doctorId);
        const consultDoctorName = consultDoctor.mcr
          ? consultDoctor.name + ' (' + consultDoctor.mcr + ')'
          : consultDoctor.name;
        const consultDoctorSpeciality = consultDoctor.speciality ? consultDoctor.speciality : '';

        const currentUser = this.store.getUser();
        let currentUserName;

        if (this.permissionsService.getPermission('ROLE_DOCTOR') && !this.permissionsService.getPermission('ROLE_CA')) {
          // Doctor Role
          currentUserName = consultDoctor.name;
        } else {
          // CA / Other Rolew
          currentUserName = currentUser.lastName
            ? currentUser.firstName + ' ' + currentUser.lastName
            : currentUser.firstName;
        }

        const w = window.open();
        w.document.open();
        medicalCertificates.forEach(medicalCertificate => {
          const mcOption = MC_HALFDAY_OPTIONS.find(option => option.value === medicalCertificate.halfDayOption);
          const mcOptionStr = mcOption ? ' (' + mcOption.label + ') ' : '';
          const mcRemark = medicalCertificate.remark ? medicalCertificate.remark : '';
          const companyRegistrationNumber = clinic.companyRegistrationNumber ? clinic.companyRegistrationNumber : '';
          const gstRegistrationNumber = clinic.gstRegistrationNumber ? clinic.gstRegistrationNumber : '';

          const html = template
            .replace(
              '{{clinicAddress}}',
              `${clinic.address.address.toUpperCase() || ''}, SINGAPORE ${clinic.address.postalCode}`
            )
            .replace('{{companyRegistrationNumber}}', companyRegistrationNumber)
            .replace('{{gstRegistrationNumber}}', gstRegistrationNumber)
            .replace('{{clinicTel}}', clinic.contactNumber)
            .replace('{{clinicFax}}', clinic.faxNumber)
            .replace('{{patientName}}', patient.name)
            .replace('{{visitDate}}', moment().format(DISPLAY_DATE_FORMAT))
            .replace('{{patientUserIdType}}', patient.userId.idType)
            .replace('{{patientUserId}}', patient.userId.number)
            .replace('{{purpose}}', medicalCertificate.purpose)
            .replace('{{numberOfDays}}', medicalCertificate.numberOfDays + mcOptionStr)
            .replace('{{startDate}}', medicalCertificate.startDate)
            .replace('{{endDate}}', medicalCertificate.endDate)
            .replace('{{remark}}', mcRemark)
            .replace(
              '{{diagnosis}}',
              diagnosis && diagnosis.length ? diagnosis.map(d => `${d.description}`).join(', ') : ''
            )
            .replace('{{doctorName}}', consultDoctorName)
            .replace('{{doctorOccupation}}', consultDoctorSpeciality)
            .replace('{{refNo}}', medicalCertificate.referenceNumber ? medicalCertificate.referenceNumber : '')
            .replace('{{currentUserName}}', currentUserName)
            .replace('{{printDate}}', moment().format(DISPLAY_DATE_FORMAT));
          w.document.write(html);
        });

        w.document.close();
        w.onload = () => {
          w.window.print();
        };
        w.onafterprint = () => {
          w.close();
        };
      },
      err => this.alertService.error(JSON.stringify(err.error['message']))
    );
  }

  onBtnPrintLetterClicked() {
    this.apiCmsManagementService.searchLabel('REFERRAL_LETTER').subscribe(
      res => {
        const template = JSON.parse(res.payload.template);

        const consultation = this.consultationInfo;
        const patient = this.patientInfo;
        const clinic = this.store.getClinicList().find(clinic => clinic.id === this.store.getClinicId());
        // const patientReferrals = this.printFormGroup.get('referralArray').value;
        const patientReferrals = this.chargeFormGroup.get('referralFormGroup').get('referralFormArray').value;
        const consultDoctor = this.store.getDoctorList().find(doctor => doctor.id === consultation.doctorId);
        const consultDoctorName = consultDoctor.mcr
          ? consultDoctor.name + ' (' + consultDoctor.mcr + ')'
          : consultDoctor.name;
        const currentUser = this.store.getUser();
        let currentUserName;

        if (this.permissionsService.getPermission('ROLE_DOCTOR') && !this.permissionsService.getPermission('ROLE_CA')) {
          // Doctor Role
          currentUserName = consultDoctor.name;
        } else {
          // CA / Other Rolew
          currentUserName = currentUser.firstName + ' ' + currentUser.lastName;
        }
        patientReferrals.forEach(referral => {
          let referClinic = new Clinic();
          let referDoctor: Doctor;
          let referDoctorName = '';
          if (referral.clinicId && referral.doctorId) {
            referClinic = this.store.getClinicList().find(clinic => clinic.id === referral.clinicId);
            referDoctor = this.store.getDoctorList().find(doctor => doctor.id === referral.doctorId);
            referDoctorName = referDoctor.name;
          } else {
            referClinic.name = referClinic.name ? referClinic.name : '';
            referClinic.address.address = referral.externalReferralDetails.address;
            referClinic.address.postalCode = '';

            referDoctorName = referral.externalReferralDetails.doctorName;
          }

          const html = template
            .replace(
              '{{clinicAddress}}',
              `${clinic.address.address.toUpperCase() || ''}, SINGAPORE ${clinic.address.postalCode}`
            )
            .replace('{{clinicTel}}', clinic.contactNumber)
            .replace('{{clinicFax}}', clinic.faxNumber)
            .replace('{{patientName}}', patient.name)
            .replace('{{patientUserIdType}}', patient.userId.idType)
            .replace('{{patientUserId}}', patient.userId.number)
            .replace(
              '{{referralDate}}',
              moment(referral.appointmentDateTime, DB_FULL_DATE_FORMAT).format('DD MMMM YYYY')
            )
            .replace('{{referClinicName}}', referClinic.name)
            .replace(
              '{{referClinicAddress}}',
              `${referClinic.address.address || ''}, ${referClinic.address.postalCode}`
            )
            .replace('{{referDoctorName}}', this.utilsService.convertToTitleCaseUsingSpace(referDoctorName))
            .replace('{{memo}}', referral.memo.replace(/<p>&nbsp;<\/p>/g, '') || '')
            .replace('{{doctorSpeciality}}', consultDoctor.speciality)
            .replace('{{doctorGroup}}', consultDoctor.doctorGroup)
            .replace('{{doctorName}}', consultDoctorName)
            .replace('{{currentUserName}}', currentUserName)
            .replace('{{printDate}}', moment().format(DISPLAY_DATE_FORMAT));
          if (referral.str) {
            this.printTemplate(html);
          }
        });
      },
      err => this.alertService.error(JSON.stringify(err.error['message']))
    );
  }

  onBtnPrintMemoClicked() {
    this.apiCmsManagementService.searchLabel('MEMO').subscribe(
      res => {
        const template = JSON.parse(res.payload.template);

        const consultation = this.consultationInfo;
        const patient = this.patientInfo;
        const clinic = this.store.getClinicList().find(clinic => clinic.id === this.store.getClinicId());

        const consultDoctor = this.store.getDoctorList().find(doctor => doctor.id === consultation.doctorId);
        const consultDoctorName = consultDoctor.mcr
          ? consultDoctor.name + ' (' + consultDoctor.mcr + ')'
          : consultDoctor.name;

        const currentUser = this.store.getUser();
        let currentUserName;
        if (this.permissionsService.getPermission('ROLE_DOCTOR') && !this.permissionsService.getPermission('ROLE_CA')) {
          // Doctor Role
          currentUserName = consultDoctor.name;
        } else {
          // CA / Other Rolew
          currentUserName = currentUser.firstName + ' ' + currentUser.lastName;
        }

        const date = moment().format('DD MMMM YYYY');
        const memo = this.printFormGroup.value.memo.replace(/<p>&nbsp;<\/p>/g, '');
        const html = template
          .replace(
            '{{clinicAddress}}',
            `${clinic.address.address.toUpperCase() || ''}, SINGAPORE ${clinic.address.postalCode}`
          )
          .replace('{{clinicTel}}', clinic.contactNumber)
          .replace('{{clinicFax}}', clinic.faxNumber)
          .replace('{{patientName}}', patient.name)
          .replace('{{patientUserIdType}}', patient.userId.idType)
          .replace('{{patientUserId}}', patient.userId.number)
          .replace('{{date}}', date)
          .replace('{{memo}}', memo || '')
          .replace('{{doctorSpeciality}}', consultDoctor.speciality)
          .replace('{{doctorGroup}}', consultDoctor.doctorGroup)
          .replace('{{doctorName}}', consultDoctorName)
          .replace('{{assistantName}}', currentUserName)
          .replace('{{printDate}}', moment().format(DISPLAY_DATE_FORMAT));
        this.printTemplate(html);
      },
      err => this.alertService.error(JSON.stringify(err.error['message']))
    );
  }

  onBtnPrintTimeChitClicked() {
    this.apiCmsManagementService.searchLabel('TIME_CHIT').subscribe(
      res => {
        const template = JSON.parse(res.payload.template);

        const patient = this.patientInfo;
        const consultation = this.consultationInfo;
        const clinic = this.store.getClinicList().find(clinic => clinic.id === this.store.getClinicId());

        const consultDoctor = this.store.getDoctorList().find(doctor => doctor.id === consultation.doctorId);
        const consultDoctorName = consultDoctor.mcr
          ? consultDoctor.name + ' (' + consultDoctor.mcr + ')'
          : consultDoctor.name;

        console.log('doctor: ', consultDoctor);
        const currentUser = this.store.getUser();
        let currentUserName;
        if (this.permissionsService.getPermission('ROLE_DOCTOR') && !this.permissionsService.getPermission('ROLE_CA')) {
          // Doctor Role
          currentUserName = consultDoctor.name;
        } else {
          // CA / Other Rolew
          currentUserName = currentUser.firstName + ' ' + currentUser.lastName;
        }

        const referClinic = this.store
          .getClinicList()
          .find(clinic => clinic.id === this.printFormGroup.value.referralFormGroup.clinicId);
        const referDoctor = this.store
          .getDoctorList()
          .find(doctor => doctor.id === this.printFormGroup.value.referralFormGroup.doctorId);
        const from = this.printFormGroup.value.timeChitFrom;
        const to = this.printFormGroup.value.timeChitTo;
        const html = template
          .replace(
            '{{clinicAddress}}',
            `${clinic.address.address.toUpperCase() || ''}, SINGAPORE ${clinic.address.postalCode}`
          )
          .replace('{{clinicTel}}', clinic.contactNumber)
          .replace('{{clinicFax}}', clinic.faxNumber)
          .replace('{{patientName}}', patient.name)
          .replace('{{patientUserIdType}}', patient.userId.idType)
          .replace('{{patientUserId}}', patient.userId.number)
          .replace('{{patientName}}', patient.name)
          .replace('{{patientUserId}}', patient.userId.number)
          .replace('{{consultDate}}', moment(from, DB_FULL_DATE_FORMAT).format(DISPLAY_DATE_FORMAT))
          .replace('{{consultStartTime}}', moment(from, DB_FULL_DATE_FORMAT).format('HHmm'))
          .replace('{{consultEndTime}}', moment(to, DB_FULL_DATE_FORMAT).format('HHmm'))
          .replace('{{doctorSpeciality}}', consultDoctor.speciality)
          .replace('{{doctorName}}', consultDoctorName)
          .replace('{{currentUserName}}', currentUserName)
          .replace(new RegExp('{{printDate}}', 'g'), moment().format(DISPLAY_DATE_FORMAT));
        this.printTemplate(html);
      },
      err => this.alertService.error(JSON.stringify(err.error['message']))
    );
  }

  onBtnPrintPatientLabelClicked() {
    this.printTemplateService.onBtnPrintPatientLabelClicked(this.patientInfo);
  }

  onBtnPrintVCClicked() {
    this.apiCmsManagementService.searchLabel('VACCINATION_CERTIFICATE').subscribe(
      res => {
        const template = JSON.parse(res.payload.template);
        // let template = vaccinationCertificateTemplate;
        const consultation = this.consultationInfo;
        const patient = this.patientInfo;
        const clinic = this.store.getClinicList().find(clinic => clinic.id === this.store.getClinicId());
        const vaccinations = this.consultationInfo.immunisationGiven.immunisation;
        const consultDoctor = this.store.getDoctorList().find(doctor => doctor.id === consultation.doctorId);
        const currentUser = this.store.getUser();
        let currentUserName;
        if (this.permissionsService.getPermission('ROLE_DOCTOR') && !this.permissionsService.getPermission('ROLE_CA')) {
          // Doctor Role
          currentUserName = consultDoctor.name;
        } else {
          // CA / Other Rolew
          currentUserName = currentUser.firstName + ' ' + currentUser.lastName;
        }
        let html = '';
        vaccinations.forEach(vaccination => {
          html = template
            .replace(
              '{{clinicAddress}}',
              `${clinic.address.address.toUpperCase() || ''}, SINGAPORE ${clinic.address.postalCode}`
            )
            .replace('{{clinicTel}}', clinic.contactNumber)
            .replace('{{clinicFax}}', clinic.faxNumber)
            .replace('{{patientName}}', patient.name)
            .replace('{{patientUserIdType}}', patient.userId.idType)
            .replace('{{patientUserId}}', patient.userId.number)
            .replace('{{patientGender}}', patient.gender)
            .replace('{{patientDOB}}', patient.dob)
            .replace('{{doctorName}}', consultDoctor.name)
            .replace('{{doctorOccupation}}', consultDoctor.speciality)
            .replace('{{currentUserName}}', currentUserName)
            .replace('{{printDate}}', moment().format(DISPLAY_DATE_FORMAT));

          const immunizations = vaccinations
            .map(vaccination => {
              const detail = this.store.getVacinnationList().find(vaccine => vaccine.id === vaccination.vaccinationId);
              const doseDetail = detail.doses.find(dose => dose.doseId === vaccination.doseId);
              console.log('detail: ', detail);
              return {
                name: detail.name,
                // dose: detail.doses,
                dateAdminstered: vaccination.immunisationDate
              };
            })
            .map(
              obj => `<div class="row">
                  <div class="col-6">
                      ${obj.name}
                  </div>
                  <div class="col-6">
                      ${obj.dateAdminstered || '-'}
                  </div>
              </div>`
            );

          html = html.replace('{{immunizations}}', immunizations.join('\n'));
        });
        console.log('PRINTING TEMPLATE:');
        this.printTemplate(html);
      },
      err => this.alertService.error(JSON.stringify(err.error['message']))
    );
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.code === '0x003D') {
      this.onBtnPrintLabelClicked();
    } else if (event.code === '0x0042') {
      this.onBtnPrintMCClicked();
    }
  }
}
