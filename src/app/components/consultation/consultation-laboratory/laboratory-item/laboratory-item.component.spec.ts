import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LaboratoryItemComponent } from './laboratory-item.component';
import { SharedModule } from '../../../../shared.module';
import { TestingModule } from '../../../../test/testing.module';
import { ConsultationFormService } from '../../../../services/consultation-form.service';
import { FormGroup } from '../../../../../../node_modules/@angular/forms';
import { DiscountComponent } from '../../discount/discount.component';

describe('LaboratoryItemComponent', () => {
  let component: LaboratoryItemComponent;
  let fixture: ComponentFixture<LaboratoryItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, TestingModule],
      declarations: [LaboratoryItemComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LaboratoryItemComponent);
    component = fixture.componentInstance;
    component.laboratoryItem = fixture.debugElement.injector.get(ConsultationFormService).initIssuedMedicalTestDetails()
      .controls[0] as FormGroup;
    component.medTests = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
