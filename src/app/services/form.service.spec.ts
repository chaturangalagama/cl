import { TestBed, inject } from '@angular/core/testing';

import { FormService } from './form.service';
import { TestingModule } from '../test/testing.module';

describe('FormService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      providers: [FormService]
    });
  });

  it(
    'should be created',
    inject([FormService], (service: FormService) => {
      expect(service).toBeTruthy();
    })
  );
});
