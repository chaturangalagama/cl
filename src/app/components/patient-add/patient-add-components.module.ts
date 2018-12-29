import { PatientDetailMedicalCoverageComponent } from './../patient-detail/patient-detail-medical-coverage/patient-detail-medical-coverage.component';
import { SharedModule } from '../../shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientAddAlertsInfoComponent } from './patient-add-alerts-info/patient-add-alerts-info.component';
import { PatientAddPatientInfoComponent } from './patient-add-patient-info/patient-add-patient-info.component';
import { PatientAddShowMedicalCoverageComponent } from '../patient-add/patient-add-medical-coverage/patient-add-show-medical-coverage/patient-add-show-medical-coverage.component';
import { PatientAddEmergencyContactComponent } from './patient-add-emergency-contact/patient-add-emergency-contact.component';
import { PatientAddOtherPatientInfoComponent } from './patient-add-other-patient-info/patient-add-other-patient-info.component';
import { PatientAddCompanyInfoComponent } from './patient-add-company-info/patient-add-company-info.component';
import { PatientAddConfirmationComponent } from './patient-add-confirmation/patient-add-confirmation.component';
import { PatientAddConsultationComponent } from './patient-add-consultation/patient-add-consultation.component';
import { PatientAddMedicalCoverageSummaryComponent } from './patient-add-medical-coverage-summary/patient-add-medical-coverage-summary.component';
import { PatientAddAlertsInfoAddAllergyComponent } from './patient-add-alerts-info/patient-add-alerts-info-add-allergy/patient-add-alerts-info-add-allergy/patient-add-alerts-info-add-allergy.component';
import { PatientAddQueueConfirmationComponent } from './patient-add-queue-confirmation/patient-add-queue-confirmation.component';
import { AddQueueMedicalCoverageComponent } from './patient-add-queue-confirmation/add-queue-medical-coverage/add-queue-medical-coverage.component';
import { AddQueueMedicalCoverageItemComponent } from './patient-add-queue-confirmation/add-queue-medical-coverage/add-queue-medical-coverage-item/add-queue-medical-coverage-item.component';
import { PatientAddShowMedicalCoverageItemComponent } from './patient-add-medical-coverage/patient-add-show-medical-coverage/patient-add-show-medical-coverage-item/patient-add-show-medical-coverage-item.component';
import { PatientAddMedicalCoverageSummaryItemComponent } from './patient-add-medical-coverage-summary/patient-add-medical-coverage-summary-item/patient-add-medical-coverage-summary-item.component';
import { PatientUpdateConfirmationComponent } from './patient-update-confirmation/patient-update-confirmation.component';
@NgModule({
  imports: [CommonModule, SharedModule],
  exports: [
    PatientAddPatientInfoComponent,
    PatientAddAlertsInfoComponent,
    PatientAddShowMedicalCoverageComponent,
    PatientAddEmergencyContactComponent,
    PatientAddOtherPatientInfoComponent,
    PatientAddCompanyInfoComponent,
    PatientDetailMedicalCoverageComponent,
    // PatientAddQueueConfirmationComponent,
    PatientUpdateConfirmationComponent,
    PatientAddMedicalCoverageSummaryComponent
  ],
  declarations: [
    PatientAddPatientInfoComponent,
    PatientAddAlertsInfoComponent,
    PatientAddShowMedicalCoverageComponent,
    PatientAddEmergencyContactComponent,
    PatientAddOtherPatientInfoComponent,
    PatientAddCompanyInfoComponent,
    PatientDetailMedicalCoverageComponent,
    PatientAddConfirmationComponent,
    // PatientAddConsultationComponent,
    PatientAddMedicalCoverageSummaryComponent,
    PatientAddAlertsInfoAddAllergyComponent,
    // PatientAddQueueConfirmationComponent,
    // AddQueueMedicalCoverageComponent,
    // AddQueueMedicalCoverageItemComponent,
    PatientAddShowMedicalCoverageItemComponent,
    PatientAddMedicalCoverageSummaryItemComponent,
    PatientUpdateConfirmationComponent
  ],
  entryComponents: [
    PatientDetailMedicalCoverageComponent,
    PatientAddConfirmationComponent,
    PatientAddAlertsInfoAddAllergyComponent,
    // PatientAddQueueConfirmationComponent,
    PatientUpdateConfirmationComponent
  ]
})
export class PatientAddComponentsModule {}
