import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentMedicalTestComponent } from './payment-medical-test.component';
import { TestingModule } from '../../../test/testing.module';
import { PaymentService } from '../../../services/payment.service';
import { FormGroup } from '../../../../../node_modules/@angular/forms';

describe('PaymentMedicalTestComponent', () => {
  let component: PaymentMedicalTestComponent;
  let fixture: ComponentFixture<PaymentMedicalTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [PaymentMedicalTestComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentMedicalTestComponent);
    component = fixture.componentInstance;
    component.medicalTestFormGroup = fixture.debugElement.injector
      .get(PaymentService)
      .getChargeFormGroup()
      .get('medicalTestFormGroup') as FormGroup;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
