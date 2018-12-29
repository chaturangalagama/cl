import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientCompanyInformationComponent } from './patient-company-information.component';

describe('PatientCompanyInformationComponent', () => {
  let component: PatientCompanyInformationComponent;
  let fixture: ComponentFixture<PatientCompanyInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PatientCompanyInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientCompanyInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
