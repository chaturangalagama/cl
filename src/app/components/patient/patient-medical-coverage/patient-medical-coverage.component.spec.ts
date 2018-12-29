import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientMedicalCoverageComponent } from './patient-medical-coverage.component';

describe('PatientMedicalCoverageComponent', () => {
  let component: PatientMedicalCoverageComponent;
  let fixture: ComponentFixture<PatientMedicalCoverageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PatientMedicalCoverageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientMedicalCoverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
