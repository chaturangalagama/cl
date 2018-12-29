import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientOtherInformationComponent } from './patient-other-information.component';

describe('PatientOtherInformationComponent', () => {
  let component: PatientOtherInformationComponent;
  let fixture: ComponentFixture<PatientOtherInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PatientOtherInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientOtherInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
