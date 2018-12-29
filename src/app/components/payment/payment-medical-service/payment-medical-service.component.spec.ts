import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentMedicalServiceComponent } from './payment-medical-service.component';
import { TestingModule } from '../../../test/testing.module';
import { PaymentService } from '../../../services/payment.service';
import { FormGroup } from '../../../../../node_modules/@angular/forms';

describe('PaymentMedicalServiceComponent', () => {
  let component: PaymentMedicalServiceComponent;
  let fixture: ComponentFixture<PaymentMedicalServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [PaymentMedicalServiceComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentMedicalServiceComponent);
    component = fixture.componentInstance;
    component.medicalServiceFormGroup = fixture.debugElement.injector
      .get(PaymentService)
      .getChargeFormGroup()
      .get('medicalServiceFormGroup') as FormGroup;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
