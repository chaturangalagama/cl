import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugUpdateComponent } from './drug-update.component';
import { TestingModule } from '../../../../test/testing.module';

describe('DrugUpdateComponent', () => {
  let component: DrugUpdateComponent;
  let fixture: ComponentFixture<DrugUpdateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [DrugUpdateComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrugUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
