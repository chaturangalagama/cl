import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientDetailMedicalCoverageComponent } from './patient-detail-medical-coverage.component';
import { TestingModule } from '../../../test/testing.module';
import { FormBuilder } from '../../../../../node_modules/@angular/forms';

describe('PatientDetailMedicalCoverageComponent', () => {
  let component: PatientDetailMedicalCoverageComponent;
  let fixture: ComponentFixture<PatientDetailMedicalCoverageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [PatientDetailMedicalCoverageComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientDetailMedicalCoverageComponent);
    component = fixture.componentInstance;
    component.itemArray = new FormBuilder().array([]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
