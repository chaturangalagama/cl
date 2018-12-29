import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalServiceItemComponent } from './medical-service-item.component';
import { SharedModule } from '../../../../shared.module';
import { DiscountComponent } from '../../discount/discount.component';
import { TestingModule } from '../../../../test/testing.module';
import { ConsultationFormService } from '../../../../services/consultation-form.service';
import { FormGroup } from '../../../../../../node_modules/@angular/forms';

describe('MedicalServiceItemComponent', () => {
  let component: MedicalServiceItemComponent;
  let fixture: ComponentFixture<MedicalServiceItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, TestingModule],
      declarations: [MedicalServiceItemComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicalServiceItemComponent);
    component = fixture.componentInstance;
    component.medicalServiceItem = fixture.debugElement.injector.get(ConsultationFormService).initMedicalServiceGiven()
      .controls[0] as FormGroup;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
