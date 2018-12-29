import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientEmergencyContactComponent } from './patient-emergency-contact.component';

describe('PatientEmergencyContactComponent', () => {
  let component: PatientEmergencyContactComponent;
  let fixture: ComponentFixture<PatientEmergencyContactComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PatientEmergencyContactComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientEmergencyContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
