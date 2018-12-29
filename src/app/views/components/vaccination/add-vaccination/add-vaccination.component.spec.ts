import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVaccinationComponent } from './add-vaccination.component';
import { TestingModule } from '../../../../test/testing.module';

describe('AddVaccinationComponent', () => {
  let component: AddVaccinationComponent;
  let fixture: ComponentFixture<AddVaccinationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddVaccinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
