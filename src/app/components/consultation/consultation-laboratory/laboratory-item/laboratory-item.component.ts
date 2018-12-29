import { GST } from './../../../../constants/app.constants';
import { MaxDiscountClass, MaxDiscount } from './../../../../objects/response/MaxDiscount';
import { ConsultationMedicalCoverage } from './../../../../objects/ConsultationMedicalCoverage';
import { ApiPatientVisitService } from './../../../../services/api-patient-visit.service';
import { Laboratory } from './../../../../objects/LabAddress';
import { IOption } from 'ng-select';
import { MedicalTest } from './../../../../objects/response/MedicalTestListAll';
import { SelectItemOptions } from './../../../../objects/SelectItemOptions';
import { ApiCmsManagementService } from './../../../../services/api-cms-management.service';
import { FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { StoreService } from '../../../../services/store.service';
import { AlertService } from '../../../../services/alert.service';
import PaymentCheck from '../../../../objects/request/PaymentCheck';

@Component({
  selector: 'app-laboratory-item',
  templateUrl: './laboratory-item.component.html',
  styleUrls: ['./laboratory-item.component.scss']
})
export class LaboratoryItemComponent implements OnInit, OnChanges {
  @Input() laboratoryItem: FormGroup;
  @Input() index: number;
  @Output() onDelete = new EventEmitter<number>();

  isDiscountShown = false;
  isDiscountGiven = false;

  medTests: MedicalTest[];

  codes = [];
  categories = [];
  serviceNames = [];
  labs = [];
  plans = [];

  maxDiscount: MaxDiscountClass;

  category: any;
  testName: any;
  price: any;
  priceWithGST: any;
  plan: string;

  constructor(
    private apiCmsManagementService: ApiCmsManagementService,
    private apiPatientVisitService: ApiPatientVisitService,
    private store: StoreService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.subscribeChanges();
    this.maxDiscount = new MaxDiscountClass();

    this.medTests = this.store.medicalTestList;

    const tempCategories: Array<IOption> = new Array<IOption>();
    const uniqueCategory = [];

    this.medTests.map((value, index) => {
      if (!uniqueCategory) {
        uniqueCategory[0] = [value.category];
        tempCategories.push({
          value: value.category,
          label: value.category
        });
        // tempCategories.
      } else {
        if (uniqueCategory.indexOf(value.category) === -1) {
          uniqueCategory.push(value.category);
          tempCategories.push({
            value: value.category,
            label: value.category
          });
        }
      }
    });

    this.populateTestCodeAndNames(this.medTests);
    this.categories = tempCategories;
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('>>LAB CHANGE<<', changes);
  }

  subscribeChanges() {
    this.laboratoryItem.get('testId').valueChanges.subscribe(data => {
      console.log('Lab Item', data);
      if (data) {
        this.setMandatoryFields();
      } else {
        this.unsetMandatoryFields();
      }
    });
  }

  onCodeSelected(option) {
    if (option) {
      this.testName = option.name;
      this.category = option.category;
      this.populateLaboratories(option.laboratories);
      this.checkLabPlan(option.id);

      this.updateMaxDiscount(option.priceAdjustment);

      // this.apiPatientVisitService
      //   .paymentCheckMedicalTest(this.store.getPatientVisitRegistryId(), [option.id])
      //   .subscribe(
      //     resp => console.log('med test plan', resp),
      //     err => {
      //       this.alertService.error(JSON.stringify(err.error.message));
      //     }
      //   );
    } else {
      this.onCodesDeselected('');
    }
  }

  onCategoriesSelected(option) {
    if (option !== undefined) {
      const tempMedTest = this.medTests.filter((value: MedicalTest) => {
        // console.log('...', option.value, value);
        return value.category === option.value;
      });
      console.log('Temp Med Test', tempMedTest);
      this.populateTestCodeAndNames(tempMedTest);

      this.laboratoryItem.get('testId').setValue('');
      this.testName = '';
    } else {
      this.onCategoriesDeselected('');
      this.populateTestCodeAndNames(this.medTests);
    }
  }

  onServiceNameSelected(option) {
    if (option !== undefined) {
      this.populateLaboratories(option.laboratories);

      const labId = option.id;
      this.laboratoryItem.get('testId').setValue(option.id);
      this.category = option.category;

      this.checkLabPlan(option.id);

      this.updateMaxDiscount(option.priceAdjustment);
    } else {
      this.onServiceNameDeselected('');
    }
  }

  onCodesDeselected(option) {
    this.labs = [];
    this.category = [];
    this.testName = [];
    this.plans = [];
    this.laboratoryItem.get('suggestedLocation').patchValue('');
    this.plan = '';
    this.price = '';
    this.priceWithGST = '';
  }

  onCategoriesDeselected(option) {
    console.log('Category Removed');
    this.populateTestCodeAndNames(this.medTests);
    this.labs = [];
    this.laboratoryItem.get('testId').setValue('');
    this.laboratoryItem.get('suggestedLocation').patchValue('');
    this.testName = [];
    this.plans = [];
    this.plan = '';
    this.price = '';
    this.priceWithGST = '';
  }

  onServiceNameDeselected(option) {
    // clear other selects
    this.labs = [];
    this.laboratoryItem.get('testId').setValue('');
    this.laboratoryItem.get('suggestedLocation').patchValue('');
    this.category = [];
    this.plans = [];
    this.plan = '';
    this.price = '';
    this.priceWithGST = '';
  }

  populateTestCodeAndNames(data) {
    this.codes = data;
    this.serviceNames = data;
  }

  populateLaboratories(laboratories: Laboratory[]) {
    this.labs = laboratories;
  }

  checkLabPlan(testId: string) {
    const testItem = new PaymentCheck(testId);
    this.apiPatientVisitService
      .paymentCheckMedicalTest(this.store.getPatientVisitRegistryId(), [testItem])
      .subscribe(data => {
        console.log('lab plan', data);
        const itemPrice = data.payload.find(element => {
          return element['itemId'] === testId;
        });
        this.price = itemPrice.charge.price.toFixed(2);
        this.priceWithGST = (itemPrice.charge.price * GST).toFixed(2);
        // this.populatePlan(testId[0], data);
      });
  }

  toggleDiscount() {
    this.isDiscountShown = !this.isDiscountShown;
  }

  updateMaxDiscount(maxDiscount: MaxDiscount) {
    this.laboratoryItem
      .get('priceAdjustment')
      .get('paymentType')
      .patchValue(maxDiscount.paymentType);

    this.maxDiscount = maxDiscount;
  }

  onbtnDeleteClicked() {
    this.onDelete.emit(this.index);
  }

  setMandatoryFields() {
    this.laboratoryItem.get('suggestedLocation').setValidators([Validators.required]);
    this.laboratoryItem.get('suggestedLocation').markAsTouched();
    this.laboratoryItem.get('suggestedLocation').updateValueAndValidity();
  }

  unsetMandatoryFields() {
    this.laboratoryItem.get('suggestedLocation').setValidators(null);
    this.laboratoryItem.get('suggestedLocation').markAsTouched();
    this.laboratoryItem.get('suggestedLocation').updateValueAndValidity();
  }
}
