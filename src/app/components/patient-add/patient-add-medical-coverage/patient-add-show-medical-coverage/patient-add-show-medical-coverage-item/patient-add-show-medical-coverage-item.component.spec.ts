import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientAddShowMedicalCoverageItemComponent } from './patient-add-show-medical-coverage-item.component';
import { TestingModule } from '../../../../../test/testing.module';
import { FormBuilder } from '../../../../../../../node_modules/@angular/forms';
import { MedicalCoverageSelected, CoverageSelected } from '../../../../../objects/MedicalCoverage';

describe('PatientAddShowMedicalCoverageItemComponent', () => {
  let component: PatientAddShowMedicalCoverageItemComponent;
  let fixture: ComponentFixture<PatientAddShowMedicalCoverageItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [PatientAddShowMedicalCoverageItemComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientAddShowMedicalCoverageItemComponent);
    component = fixture.componentInstance;
    component.item = new FormBuilder().group({
      patientCoverageId: '',
      isSelected: true,
      medicalCoverageId: '',
      planRows: '',
      planId: '',
      coverageSelected: new FormBuilder().group(new MedicalCoverageSelected()),
      planSelected: new FormBuilder().group(new CoverageSelected()),
      coverageType: '',
      isNew: true,
      startDate: '',
      endDate: '',
      remarks: '',
      costCenter: ''
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
