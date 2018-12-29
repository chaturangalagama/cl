import { TestBed, inject } from '@angular/core/testing';

import { DrugService } from './drug.service';
import { TestingModule } from '../test/testing.module';
import { Drug, DrugPrice } from '../objects/Drug';
import { HttpTestingController } from '@angular/common/http/testing';

describe('DrugService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestingModule],
      providers: [DrugService]
    });
  });

  it(
    'should be created',
    inject([DrugService], (service: DrugService) => {
      expect(service).toBeTruthy();
    })
  );

  it(
    'add drug sucess',
    inject([DrugService, HttpTestingController], (service: DrugService, testHttp: HttpTestingController) => {
      const drug = new Drug('code', 'name', 'uom', new DrugPrice(10, 'chargeCode'), true);
      const response = { success: true };
      service.add(drug).subscribe(
        res => {
          expect(JSON.stringify(res)).toEqual(JSON.stringify(response));
        },
        error => fail('add drug should be success')
      );

      const req = testHttp.expectOne(
        req => req.url.includes(`/cms/drug/add/`) && req.method === 'POST' && req.body === JSON.stringify(drug)
      );

      req.flush(response);
      testHttp.verify();
    })
  );

  it(
    'add drug fail',
    inject([DrugService, HttpTestingController], (service: DrugService, testHttp: HttpTestingController) => {
      const drug = new Drug('code', 'name', 'uom', new DrugPrice(10, 'chargeCode'), true);
      const errorMessage = 'error';
      service.add(drug).subscribe(
        res => {
          fail('add drug should be fail');
        },
        error => expect(error.error.message).toEqual(errorMessage)
      );

      const req = testHttp.expectOne(
        req => req.url.includes(`/cms/drug/add/`) && req.method === 'POST' && req.body === JSON.stringify(drug)
      );

      req.error(
        new ErrorEvent('error', {
          message: errorMessage
        })
      );
      testHttp.verify();
    })
  );

  it(
    'list drug sucess',
    inject([DrugService, HttpTestingController], (service: DrugService, testHttp: HttpTestingController) => {
      const pageNum = 1;
      const pageSize = 10;
      const response = { success: true };
      service.listDrugs(pageNum, pageSize).subscribe(
        res => {
          expect(JSON.stringify(res)).toEqual(JSON.stringify(response));
        },
        error => fail('list drug should be success')
      );

      const req = testHttp.expectOne(
        req => req.url.includes(`/drug/list/${pageNum}/${pageSize}`) && req.method === 'POST'
      );

      req.flush(response);
      testHttp.verify();
    })
  );

  it(
    'list drug fail',
    inject([DrugService, HttpTestingController], (service: DrugService, testHttp: HttpTestingController) => {
      const pageNum = 1;
      const pageSize = 10;
      const errorMessage = 'error';
      service.listDrugs(pageNum, pageSize).subscribe(
        res => {
          fail('list drug should be fail');
        },
        error => expect(error.error.message).toEqual(errorMessage)
      );

      const req = testHttp.expectOne(
        req => req.url.includes(`/drug/list/${pageNum}/${pageSize}`) && req.method === 'POST'
      );

      req.error(
        new ErrorEvent('error', {
          message: errorMessage
        })
      );
      testHttp.verify();
    })
  );

  it(
    'remove drug sucess',
    inject([DrugService, HttpTestingController], (service: DrugService, testHttp: HttpTestingController) => {
      const drugId = 1;
      const response = { success: true };
      service.removeDrug(drugId).subscribe(
        res => {
          expect(JSON.stringify(res.body)).toEqual(JSON.stringify(response));
        },
        error => fail('list drug should be success')
      );

      const req = testHttp.expectOne(req => req.url.includes(`/cms/drug/remove/${drugId}`) && req.method === 'POST');

      req.flush(response);
      testHttp.verify();
    })
  );

  it(
    'remove drug fail',
    inject([DrugService, HttpTestingController], (service: DrugService, testHttp: HttpTestingController) => {
      const drugId = 1;
      const errorMessage = 'error';
      service.removeDrug(drugId).subscribe(
        res => {
          fail('remove drug should be fail');
        },
        error => expect(error.error.message).toEqual(errorMessage)
      );

      const req = testHttp.expectOne(req => req.url.includes(`/cms/drug/remove/${drugId}`) && req.method === 'POST');

      req.error(
        new ErrorEvent('error', {
          message: errorMessage
        })
      );
      testHttp.verify();
    })
  );
});
