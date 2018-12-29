import { GST } from './../../../../constants/app.constants';
import { AlertService } from './../../../../services/alert.service';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { SelectItemOptions } from '../../../../objects/SelectItemOptions';
import { ConsultationMedicalCoverage } from './../../../../objects/ConsultationMedicalCoverage';
import { MaxDiscountClass } from './../../../../objects/response/MaxDiscount';
import { MedicalServiceItemList, MedicalServiceResponse } from './../../../../objects/response/MedicalServiceResponse';
import { ApiCmsManagementService } from './../../../../services/api-cms-management.service';
import { ApiPatientVisitService } from './../../../../services/api-patient-visit.service';
import { StoreService } from './../../../../services/store.service';
import PaymentCheck from '../../../../objects/request/PaymentCheck';

@Component({
  selector: 'app-medical-service-item',
  templateUrl: './medical-service-item.component.html',
  styleUrls: ['./medical-service-item.component.scss']
})
export class MedicalServiceItemComponent implements OnInit {
  @Input() medicalServiceItem: FormGroup;
  @Input() index: number;
  @Output() onDelete = new EventEmitter<number>();

  isDiscountShown = false;
  isDiscountGiven = false;

  //   serviceCodes: Array<SelectItemOptions<MedicalServiceResponse>>;
  //   categories: Array<SelectItemOptions<MedicalServiceResponse>>;
  //   names: Array<SelectItemOptions<MedicalServiceItemList>>;
  //   plans: Array<SelectItemOptions<ConsultationMedicalCoverage>>;

  serviceCodes = [];
  categories = [];
  names = [];
  plans = [];

  plan: string;

  price: number;
  priceWithGST: number;
  maxDiscount: MaxDiscountClass;

  constructor(
    private apiCmsManagementService: ApiCmsManagementService,
    private apiPatientVisitService: ApiPatientVisitService,
    private store: StoreService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.populateCategories(this.store.medicalServiceList);

    this.maxDiscount = new MaxDiscountClass();
  }

  populateCategories(data) {
    this.categories = data;
  }

  populateNames(data) {
    this.names = data;
  }

  onCategorySelect(event: any) {
    console.log('Category Event', event);
    this.populateNames(event.medicalServiceItemList);

    this.clearFields();
  }

  onNamesSelect(event: any) {
    console.log('Name Event', event);
    this.checkMedicalServicePlan(event.id);

    this.updateDiscount(event.priceAdjustment);
  }

  private clearFields() {
    this.medicalServiceItem.get('serviceItemId').patchValue('');
    this.medicalServiceItem.get('attachedMedicalCoverages').reset();
    this.plan = '';
    this.price = 0;
    this.priceWithGST = 0;
  }

  checkMedicalServicePlan(medicalServiceId: string) {
    const medicalServiceItems = new PaymentCheck(medicalServiceId);
    this.apiPatientVisitService
      .paymentCheckMedicalService(this.store.getPatientVisitRegistryId(), [medicalServiceItems])
      .subscribe(
        data => {
          console.log('ms plan', data);
          const itemPrice = data.payload.find(element => {
            return element['itemId'] === medicalServiceId;
          });
          // this.populatePlans(medicalServiceId, data);
          this.price = itemPrice.charge.price.toFixed(2);
          this.priceWithGST = itemPrice.charge.price * GST;
          this.priceWithGST = +this.priceWithGST.toFixed(2);
        },
        err => {
          this.alertService.error(JSON.stringify(err.error.message));
        }
      );
  }

  toggleDiscount() {
    this.isDiscountShown = !this.isDiscountShown;
  }

  updateDiscount(maxDiscount: MaxDiscountClass) {
    this.medicalServiceItem
      .get('priceAdjustment')
      .get('paymentType')
      .patchValue(maxDiscount.paymentType);

    this.maxDiscount = maxDiscount;
  }

  onbtnDeleteClicked() {
    console.log('emit delete', this.index);
    this.onDelete.emit(this.index);
  }
}
