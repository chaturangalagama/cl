import { TestBed, inject } from '@angular/core/testing';

import { FormControlService } from './form-control.service';
import { TestingModule } from '../test/testing.module';

describe('FormControlService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      providers: [FormControlService]
    });
  });

  it(
    'should be created',
    inject([FormControlService], (service: FormControlService) => {
      expect(service).toBeTruthy();
    })
  );
});
