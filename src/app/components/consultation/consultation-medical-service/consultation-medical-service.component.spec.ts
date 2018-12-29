import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationMedicalServiceComponent } from './consultation-medical-service.component';
import { MedicalServiceItemComponent } from './medical-service-item/medical-service-item.component';
import { SharedModule } from '../../../shared.module';
import { TestingModule } from '../../../test/testing.module';
import { FormBuilder } from '../../../../../node_modules/@angular/forms';
import { DiscountComponent } from '../discount/discount.component';

describe('ConsultationMedicalServiceComponent', () => {
  let component: ConsultationMedicalServiceComponent;
  let fixture: ComponentFixture<ConsultationMedicalServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, TestingModule],
      declarations: [ConsultationMedicalServiceComponent, MedicalServiceItemComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultationMedicalServiceComponent);
    component = fixture.componentInstance;
    component.itemsFormArray = new FormBuilder().array([]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
