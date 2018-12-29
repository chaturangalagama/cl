import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientDetailMedicalCoverageItemComponent } from './patient-detail-medical-coverage-item.component';
import { TestingModule } from '../../../../test/testing.module';
import { MedicalCoverageSelected, CoverageSelected } from '../../../../objects/MedicalCoverage';

describe('PatientDetailMedicalCoverageItemComponent', () => {
  let component: PatientDetailMedicalCoverageItemComponent;
  let fixture: ComponentFixture<PatientDetailMedicalCoverageItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [PatientDetailMedicalCoverageItemComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientDetailMedicalCoverageItemComponent);
    component = fixture.componentInstance; 
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
