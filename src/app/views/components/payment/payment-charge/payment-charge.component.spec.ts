import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentChargeComponent } from './payment-charge.component';
import { TestingModule } from '../../../../test/testing.module';
import { PaymentService } from '../../../../services/payment.service';
import { PaymentModule } from '../payment.module';

describe('PaymentChargeComponent', () => {
  let component: PaymentChargeComponent;
  let fixture: ComponentFixture<PaymentChargeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule, PaymentModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentChargeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
