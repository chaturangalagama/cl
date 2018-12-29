import { TestBed, inject } from '@angular/core/testing';

import { MedicalCoverageService } from './medical-coverage.service';
import { TestingModule } from '../test/testing.module';

describe('MedicalCoverageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      providers: [MedicalCoverageService]
    });
  });

  it(
    'should be created',
    inject([MedicalCoverageService], (service: MedicalCoverageService) => {
      expect(service).toBeTruthy();
    })
  );
});
