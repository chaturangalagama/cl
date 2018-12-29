/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PatientAddShowMedicalCoverageComponent } from './patient-add-show-medical-coverage.component';
import { TestingModule } from '../../../../test/testing.module';
import { PatientAddShowMedicalCoverageItemComponent } from './patient-add-show-medical-coverage-item/patient-add-show-medical-coverage-item.component';

describe('PatientAddShowMedicalCoverageComponent', () => {
  let component: PatientAddShowMedicalCoverageComponent;
  let fixture: ComponentFixture<PatientAddShowMedicalCoverageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [PatientAddShowMedicalCoverageComponent, PatientAddShowMedicalCoverageItemComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientAddShowMedicalCoverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
