import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentImmunizationComponent } from './payment-immunization.component';
import { TestingModule } from '../../../test/testing.module';
import { PaymentService } from '../../../services/payment.service';
import { FormGroup } from '../../../../../node_modules/@angular/forms';

describe('PaymentImmunizationComponent', () => {
  let component: PaymentImmunizationComponent;
  let fixture: ComponentFixture<PaymentImmunizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [PaymentImmunizationComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentImmunizationComponent);
    component = fixture.componentInstance;
    component.immunizationFormGroup = fixture.debugElement.injector
      .get(PaymentService)
      .getChargeFormGroup()
      .get('immunizationFormGroup') as FormGroup;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
