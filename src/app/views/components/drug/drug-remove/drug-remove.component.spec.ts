import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugRemoveComponent } from './drug-remove.component';
import { TestingModule } from '../../../../test/testing.module';

describe('DrugRemoveComponent', () => {
  let component: DrugRemoveComponent;
  let fixture: ComponentFixture<DrugRemoveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      declarations: [DrugRemoveComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrugRemoveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
