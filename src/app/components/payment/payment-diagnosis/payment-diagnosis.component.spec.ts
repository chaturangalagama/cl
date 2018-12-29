import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentDiagnosisComponent } from './payment-diagnosis.component';
import { TestingModule } from '../../../test/testing.module';
import { PaymentService } from '../../../services/payment.service';
import { FormGroup } from '../../../../../node_modules/@angular/forms';

describe('PaymentDiagnosisComponent', () => {
  let component: PaymentDiagnosisComponent;
  let fixture: ComponentFixture<PaymentDiagnosisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [PaymentDiagnosisComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentDiagnosisComponent);
    component = fixture.componentInstance;
    component.diagnosisFormGroup = fixture.debugElement.injector
      .get(PaymentService)
      .getChargeFormGroup()
      .get('diagnosisFormGroup') as FormGroup;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
