import { TestBed, inject } from '@angular/core/testing';

import { MedicalServiceService } from './medical-service.service';
import { TestingModule } from '../test/testing.module';

describe('MedicalServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      providers: [MedicalServiceService]
    });
  });

  it(
    'should be created',
    inject([MedicalServiceService], (service: MedicalServiceService) => {
      expect(service).toBeTruthy();
    })
  );
});
