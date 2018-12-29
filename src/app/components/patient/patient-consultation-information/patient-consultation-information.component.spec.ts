import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientConsultationInformationComponent } from './patient-consultation-information.component';

describe('PatientConsultationInformationComponent', () => {
  let component: PatientConsultationInformationComponent;
  let fixture: ComponentFixture<PatientConsultationInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PatientConsultationInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientConsultationInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
