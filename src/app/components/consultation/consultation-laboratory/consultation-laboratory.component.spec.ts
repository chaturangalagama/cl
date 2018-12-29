import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationLaboratoryComponent } from './consultation-laboratory.component';
import { SharedModule } from '../../../shared.module';
import { TestingModule } from '../../../test/testing.module';
import { LaboratoryItemComponent } from './laboratory-item/laboratory-item.component';
import { DiscountComponent } from '../discount/discount.component';
import { FormBuilder } from '../../../../../node_modules/@angular/forms';

describe('ConsultationLaboratoryComponent', () => {
  let component: ConsultationLaboratoryComponent;
  let fixture: ComponentFixture<ConsultationLaboratoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, TestingModule],
      declarations: [ConsultationLaboratoryComponent, LaboratoryItemComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultationLaboratoryComponent);
    component = fixture.componentInstance;
    component.itemsFormArray = new FormBuilder().array([])
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
