import { LoggerService } from './../../../../services/logger.service';
import { AlertService } from './../../../../services/alert.service';
import { DISPLAY_DATE_FORMAT, GST } from './../../../../constants/app.constants';
import { MaxDiscount, MaxDiscountClass } from './../../../../objects/response/MaxDiscount';
import { ConsultationMedicalCoverage } from './../../../../objects/ConsultationMedicalCoverage';
import { ApiPatientVisitService } from './../../../../services/api-patient-visit.service';
import { ApiCmsManagementService } from './../../../../services/api-cms-management.service';
import { SelectItemOptions } from './../../../../objects/SelectItemOptions';
import { FormGroup } from '@angular/forms';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Vaccine, Dose } from '../../../../objects/response/VaccinationList';
import { StoreService } from '../../../../services/store.service';

import * as moment from 'moment';
import PaymentCheck from '../../../../objects/request/PaymentCheck';

@Component({
  selector: 'app-immunization-item',
  templateUrl: './immunization-item.component.html',
  styleUrls: ['./immunization-item.component.scss']
})
export class ImmunizationItemComponent implements OnInit {
  @Input() immunizationItem: FormGroup;
  @Input() index: number;
  @Output() onDelete = new EventEmitter<number>();

  vaccines = [];
  dose = [];
  plans = [];

  description: string;
  recommendedAge: string;
  price: number;
  priceWithGST: number;

  minDate: Date;
  maxDate: Date;

  maxDiscount: MaxDiscountClass;
  isDiscountShown = false;
  isDiscountGiven = false;

  plan: string;

  constructor(
    private apiCmsManagementService: ApiCmsManagementService,
    private apiPatientService: ApiPatientVisitService,
    private store: StoreService,
    private alertService: AlertService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.maxDiscount = new MaxDiscountClass();

    this.minDate = new Date();
    this.maxDate = new Date();

    this.vaccines = this.store.vaccinationList;
  }

  populateDose(data) {
    this.logger.info('Selected Dose', data);
    const tempDose = [];
    data.doses.map((value, index) => {
      tempDose.push(value);
    });
    this.dose = tempDose;
    this.logger.info('Selected Dose', this.dose);
  }

  onVaccineSelected(option) {
    // reset data
    this.clearFields();

    this.logger.info('Immu_ Select', option);
    console.log('Immu_ Select', option);
    this.populateDose(option);

    // populate recommended age
    if (option.ageInMonths !== -1) {
      console.log('Reccomended Age', option.ageInMonths);
      this.recommendedAge = option.ageInMonths;
    }
  }

  private clearFields() {
    this.immunizationItem.get('doseId').patchValue('');
    this.immunizationItem.get('nextDose').patchValue('');
    this.description = '';
    this.recommendedAge = '';
    this.plan = '';
    this.price = 0;
    this.priceWithGST = 0;
  }

  onDoseSelected(option) {
    console.log('Dose Selected', option);
    const { data } = option;
    this.description = option.description;
    this.checkVaccinationPlan(option.doseId);

    this.updateDiscount(option.priceAdjustment);

    // update next dose
    if (option.nextDoseRecommendedGap > 0) {
      const nextDoseDate = moment()
        .add(option.nextDoseRecommendedGap, 'd')
        .format('DD-MM-YYYY');
      console.log('Next Dose', nextDoseDate);
      this.immunizationItem.get('nextDose').patchValue(nextDoseDate);
    } else if (option.nextDoseRecommendedGap === 0) {
      this.immunizationItem.get('nextDose').patchValue('');
    }
  }

  checkVaccinationPlan(vaccinationId: string) {
    const vaccinationItem = new PaymentCheck(vaccinationId);
    this.apiPatientService.paymentCheckVaccination(this.store.getPatientVisitRegistryId(), [vaccinationItem]).subscribe(
      data => {
        console.log('ms plan', data);
        const itemPrice = data.payload.find(element => {
          return element['itemId'] === vaccinationId;
        });
        //this.populatePlans(vaccinationIds[0], data);
        console.log('Item Price', itemPrice);
        this.price = itemPrice.charge.price.toFixed(2);
        this.priceWithGST = +(itemPrice.charge.price * GST).toFixed(2);
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
    this.immunizationItem
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
