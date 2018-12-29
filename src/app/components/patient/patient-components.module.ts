import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientInformationComponent } from './patient-information/patient-information.component';
import { PatientMedicalCoverageComponent } from './patient-medical-coverage/patient-medical-coverage.component';
import { PatientConsultationInformationComponent } from './patient-consultation-information/patient-consultation-information.component';
import { PatientEmergencyContactComponent } from './patient-emergency-contact/patient-emergency-contact.component';
import { PatientOtherInformationComponent } from './patient-other-information/patient-other-information.component';
import { PatientCompanyInformationComponent } from './patient-company-information/patient-company-information.component';

@NgModule({
    imports: [CommonModule],
    declarations: [
        PatientInformationComponent,
        PatientMedicalCoverageComponent,
        PatientConsultationInformationComponent,
        PatientEmergencyContactComponent,
        PatientOtherInformationComponent,
        PatientCompanyInformationComponent
    ]
})
export class PatientComponentsModule {}
