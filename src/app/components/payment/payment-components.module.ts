import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { TouchedDirective } from '../../directives/touched/touched.directive';

import { PaymentDiagnosisComponent } from './payment-diagnosis/payment-diagnosis.component';
import { PaymentPrescriptionComponent } from './payment-prescription/payment-prescription.component';
import { PaymentCollectChargeComponent } from './payment-collect-charge/payment-collect-charge.component';
import { PaymentContactlessComponent } from './payment-contactless/payment-contactless.component';
import { PaymentChequeComponent } from './payment-cheque/payment-cheque.component';
import { PaymentPrintComponent } from './payment-print/payment-print.component';
import { PaymentPrintChargeComponent } from './payment-print-charge/payment-print-charge.component';
import { PaymentPatientInfoComponent } from './payment-patient-info/payment-patient-info.component';
import { PaymentMedicalServiceComponent } from './payment-medical-service/payment-medical-service.component';
import { PaymentMedicalTestComponent } from './payment-medical-test/payment-medical-test.component';
import { PaymentImmunizationComponent } from './payment-immunization/payment-immunization.component';
import { PaymentOverallChargeComponent } from './payment-overall-charge/payment-overall-charge.component';
import { PaymentFollowUpComponent } from './payment-follow-up/payment-follow-up.component';
import { PaymentReferralComponent } from './payment-referral/payment-referral.component';
import { PaymentCoverageLimitComponent } from './payment-coverage-limit/payment-coverage-limit.component';
import { PaymentCollectMethodComponent } from './payment-collect-method/payment-collect-method.component';
import { PaymentMethodItemComponent } from './payment-collect-method/payment-method-item/payment-method-item.component';
import { PaymentCollectSummaryComponent } from './payment-collect-summary/payment-collect-summary.component';

@NgModule({
  imports: [CommonModule, SharedModule],
  exports: [
    PaymentDiagnosisComponent,
    PaymentPrescriptionComponent,
    PaymentCollectChargeComponent,
    PaymentCollectMethodComponent, 
    PaymentMethodItemComponent,
    PaymentCollectSummaryComponent,
    PaymentContactlessComponent,
    PaymentChequeComponent,
    PaymentPrintComponent,
    PaymentPrintChargeComponent,
    PaymentPatientInfoComponent,
    PaymentMedicalServiceComponent,
    PaymentMedicalTestComponent,
    PaymentImmunizationComponent,
    PaymentOverallChargeComponent,
    PaymentFollowUpComponent,
    PaymentReferralComponent,
    PaymentCoverageLimitComponent
  ],
  declarations: [
    TouchedDirective,
    PaymentDiagnosisComponent,
    PaymentPrescriptionComponent,
    PaymentCollectChargeComponent,
    PaymentCollectMethodComponent,
    PaymentMethodItemComponent,
    PaymentCollectSummaryComponent,
    PaymentContactlessComponent,
    PaymentChequeComponent,
    PaymentPrintComponent,
    PaymentPrintChargeComponent,
    PaymentPatientInfoComponent,
    PaymentMedicalServiceComponent,
    PaymentMedicalTestComponent,
    PaymentImmunizationComponent,
    PaymentOverallChargeComponent,
    PaymentFollowUpComponent,
    PaymentReferralComponent,
    PaymentCoverageLimitComponent
  ]
})
export class PaymentComponentsModule {}
