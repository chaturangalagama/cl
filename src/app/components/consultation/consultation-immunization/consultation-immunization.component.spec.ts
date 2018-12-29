import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationImmunizationComponent } from './consultation-immunization.component';
import { SharedModule } from '../../../shared.module';
import { ImmunizationItemComponent } from './immunization-item/immunization-item.component';
import { DiscountComponent } from '../discount/discount.component';
import { TestingModule } from '../../../test/testing.module';
import { FormBuilder } from '../../../../../node_modules/@angular/forms';

describe('ConsultationImmunizationComponent', () => {
  let component: ConsultationImmunizationComponent;
  let fixture: ComponentFixture<ConsultationImmunizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, TestingModule],
      declarations: [ConsultationImmunizationComponent, ImmunizationItemComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultationImmunizationComponent);
    component = fixture.componentInstance;
    component.itemsFormArray = new FormBuilder().array([])
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
