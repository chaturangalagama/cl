import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImmunizationItemComponent } from './immunization-item.component';
import { SharedModule } from '../../../../shared.module';
import { TestingModule } from '../../../../test/testing.module';
import { DiscountComponent } from '../../discount/discount.component';
import { ConsultationFormService } from '../../../../services/consultation-form.service';
import { FormGroup } from '../../../../../../node_modules/@angular/forms';

describe('ImmunizationItemComponent', () => {
  let component: ImmunizationItemComponent;
  let fixture: ComponentFixture<ImmunizationItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, TestingModule],
      declarations: [ImmunizationItemComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImmunizationItemComponent);
    component = fixture.componentInstance;
    component.immunizationItem = fixture.debugElement.injector
      .get(ConsultationFormService)
      .initImmunisation().controls[0] as FormGroup
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
