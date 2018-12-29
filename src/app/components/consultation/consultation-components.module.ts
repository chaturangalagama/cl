// import { PatientAddQueueConfirmationComponent } from './../patient-add/patient-add-queue-confirmation/patient-add-queue-confirmation.component';
import { NgModule } from '@angular/core';

import { TouchedObjectDirective } from '../../directives/touched/touched.object.directive';
import { SharedModule } from './../../shared.module';
import { ConsultationDiagnosisItemComponent } from './consultation-diagnosis/consultation-diagnosis-item/consultation-diagnosis-item.component';
import { ConsultationDiagnosisComponent } from './consultation-diagnosis/consultation-diagnosis.component';
import { ConsultationFollowUpComponent } from './consultation-follow-up/consultation-follow-up.component';
import { ConsultationHistoryItemComponent } from './consultation-history/consultation-history-item/consultation-history-item.component';
import { ConsultationHistoryComponent } from './consultation-history/consultation-history.component';
import { ConsultationImmunizationComponent } from './consultation-immunization/consultation-immunization.component';
import { ImmunizationItemComponent } from './consultation-immunization/immunization-item/immunization-item.component';
import { ConsultationLaboratoryComponent } from './consultation-laboratory/consultation-laboratory.component';
import { LaboratoryItemComponent } from './consultation-laboratory/laboratory-item/laboratory-item.component';
import { MedicalCertificateItemControlComponent } from './consultation-medical-certificate/medical-certificate-item-control.component';
import { MedicalCertificateItemsArrayComponent } from './consultation-medical-certificate/medical-certificate-items-array.component';
import { ConsultationMedicalServiceComponent } from './consultation-medical-service/consultation-medical-service.component';
import { MedicalServiceItemComponent } from './consultation-medical-service/medical-service-item/medical-service-item.component';
import { ConsultationMedicalServicesComponent } from './consultation-medical-services/consultation-medical-services.component';
import { ConsultationMemoComponent } from './consultation-memo/consultation-memo.component';
import { ConsultationNotesComponent } from './consultation-notes/consultation-notes.component';
import { ConsultationPatientDocumentComponent } from './consultation-patient-document/consultation-patient-document.component';
import { ConsultationPatientAlertInfoComponent } from './consultation-patient-info/consultation-patient-alert-info/consultation-patient-alert-info.component';
import { ConsultationPatientInfoComponent } from './consultation-patient-info/consultation-patient-info.component';
import { ConsultationPrescriptionComponent } from './consultation-prescription/consultation-prescription.component';
import { PrescriptionItemComponent } from './consultation-prescription/prescription-item/prescription-item.component';
import { ConsultationReferralComponent } from './consultation-referral/consultation-referral.component';
import { ReferralItemComponent } from './consultation-referral/referral-item/referral-item.component';
import { DiscountComponent } from './discount/discount.component';
import { VitalTrendComponent } from './vital/vital-trend/vital-trend.component';
import { VitalComponent } from './vital/vital.component';
import { ConsultationProblemListComponent } from './consultation-problem-list/consultation-problem-list.component';
import { ConsultationHistoryMainContainerComponent } from './consultation-history/consultation-history-main-container/consultation-history-main-container.component';
import { ClinicNotesComponent } from './clinic-notes/clinic-notes.component';
import { ConsultationDocumentsComponent } from './consultation-documents/consultation-documents.component';
// import { PatientAddConsultationComponent } from './../patient-add/patient-add-consultation/patient-add-consultation.component';

@NgModule({
  imports: [SharedModule],
  declarations: [
    ConsultationPatientInfoComponent,
    ConsultationPatientDocumentComponent,
    ConsultationDiagnosisComponent,
    ConsultationPrescriptionComponent,
    ConsultationImmunizationComponent,
    ConsultationReferralComponent,
    ConsultationMemoComponent,
    ConsultationFollowUpComponent,
    ConsultationLaboratoryComponent,
    ConsultationMedicalServicesComponent,
    ConsultationNotesComponent,
    ConsultationHistoryComponent,
    // PatientAddQueueConfirmationComponent,

    VitalComponent,
    VitalTrendComponent,
    MedicalCertificateItemsArrayComponent,
    MedicalCertificateItemControlComponent,
    ConsultationHistoryItemComponent,
    ConsultationMedicalServiceComponent,

    PrescriptionItemComponent,
    MedicalServiceItemComponent,
    MedicalCertificateItemsArrayComponent,
    LaboratoryItemComponent,
    // ReferralItemComponent,
    ImmunizationItemComponent,
    TouchedObjectDirective,
    ConsultationDiagnosisItemComponent,
    ConsultationPatientAlertInfoComponent,
    ConsultationProblemListComponent,
    ConsultationHistoryMainContainerComponent,
    ClinicNotesComponent,
    ConsultationDocumentsComponent
    // PatientAddConsultationComponent
  ],
  exports: [
    ConsultationPatientInfoComponent,
    ConsultationPatientDocumentComponent,
    ConsultationDiagnosisComponent,
    ConsultationPrescriptionComponent,
    ConsultationImmunizationComponent,
    ConsultationReferralComponent,
    ConsultationMemoComponent,
    ConsultationFollowUpComponent,
    ConsultationLaboratoryComponent,
    ConsultationMedicalServicesComponent,
    ConsultationNotesComponent,
    ConsultationHistoryComponent,
    ConsultationMedicalServiceComponent,
    // PatientAddQueueConfirmationComponent,

    VitalComponent,
    VitalTrendComponent,
    MedicalCertificateItemControlComponent,
    MedicalCertificateItemsArrayComponent,
    LaboratoryItemComponent,

    MedicalServiceItemComponent,
    ReferralItemComponent,
    ClinicNotesComponent,
    ConsultationDocumentsComponent
    // PatientAddConsultationComponent
  ]
})
export class ConsultationComponentsModule { }
