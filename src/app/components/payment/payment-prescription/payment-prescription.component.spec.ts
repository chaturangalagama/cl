import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentPrescriptionComponent } from './payment-prescription.component';
import { TestingModule } from '../../../test/testing.module';
import { PaymentService } from '../../../services/payment.service';
import { FormGroup } from '../../../../../node_modules/@angular/forms';

describe('PaymentPrescriptionComponent', () => {
  let component: PaymentPrescriptionComponent;
  let fixture: ComponentFixture<PaymentPrescriptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [PaymentPrescriptionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentPrescriptionComponent);
    component = fixture.componentInstance;
    component.prescriptionFormGroup = fixture.debugElement.injector
      .get(PaymentService)
      .getChargeFormGroup()
      .get('prescriptionFormGroup') as FormGroup;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
