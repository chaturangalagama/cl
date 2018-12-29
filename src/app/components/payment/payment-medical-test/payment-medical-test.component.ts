import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { Subscription, Subject } from '../../../../../node_modules/rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { PaymentService } from '../../../services/payment.service';
import { StoreService } from '../../../services/store.service';
import { ApiPatientVisitService } from '../../../services/api-patient-visit.service';
import { AlertService } from '../../../services/alert.service';
import { MedicalTest } from '../../../objects/response/MedicalTestListAll';
import { MaxDiscountClass } from '../../../objects/response/MaxDiscount';

@Component({
  selector: 'app-payment-medical-test',
  templateUrl: './payment-medical-test.component.html',
  styleUrls: ['./payment-medical-test.component.scss']
})
export class PaymentMedicalTestComponent implements OnInit {
  @Input() medicalTestFormGroup: FormGroup;
  visitCoverageArray;
  medicalTests: Array<MedicalTest>;
  medicatTestCategory = [];

  consultationInfo;
  consultationInfoSubscription: Subscription;
  updatePrice: Subject<any> = new Subject();

  constructor(
    private alertService: AlertService,
    private store: StoreService,
    private paymentService: PaymentService,
    private apiPatientVisitService: ApiPatientVisitService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.visitCoverageArray = this.paymentService.visitCoverageArray;
    this.medicalTests = this.store.medicalTestList;
    this.medicatTestCategory = this.store.getMedicalTestListOptions();

    this.consultationInfoSubscription = this.paymentService
      .getConsultationInfoObservable()
      .subscribe(consultationInfo => {
        this.consultationInfo = consultationInfo;
      });
  }

  ngOnDestroy() {
    if (this.consultationInfoSubscription) {
      this.consultationInfoSubscription.unsubscribe();
    }
  }

  onBtnAdd(form: FormGroup) {
    form.patchValue({
      isAdd: true
    });
  }

  onDelete(form: FormGroup, index: number) {
    form.patchValue({
      isDelete: true,
      deleteIndex: index
    });
    const formArray = form.parent as FormArray;
    formArray.removeAt(index);
  }

  toggleDiscount(form) {
    form.patchValue({
      isCollapsed: !form.value.isCollapsed
    });
  }

  subscribeMedicalTestArrayItemValueChanges(item: FormGroup, values) {
    if (values.isDelete) {
      this.consultationInfo.issuedMedicalTest.issuedMedicalTestDetails.splice(values.deleteIndex, 1);
      this.paymentService.setConsultationInfo(this.consultationInfo);
      this.updatePrice.next();
      return;
    }

    const selectedTest =
      this.store
        .getMedicalTestList()
        .find(detail => detail.category === values.category && detail.id === values.testCode) ||
      this.store.getMedicalTestList().find(detail => detail.category === values.category);
    if (!selectedTest) {
      return;
    }

    const categoryFilteredTest = this.filterTestByCategory(selectedTest.category);
    const testCode = selectedTest.id;
    const testName = selectedTest.id;
    const labs = selectedTest.laboratories.map(lab => {
      const label = lab.name;
      return {
        value: label,
        label
      };
    });
    const lab = labs[0].value;

    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = values.plan;
    const excludedPlans = plans.filter(obj => plan.indexOf(obj.value) < 0).map(val => val.value);
    console.log('Excluded Plan: ' + excludedPlans);
    const medicalTestPaymentCheck: { itemId: string; excludedCoveragePlanIds: any }[] = [
      { itemId: selectedTest.id, excludedCoveragePlanIds: excludedPlans || [] }
    ];
    this.apiPatientVisitService
      .paymentCheckMedicalTest(this.store.getPatientVisitRegistryId(), medicalTestPaymentCheck)
      .subscribe(
        res => {
          const charge = res.payload.find(val => val.itemId === selectedTest.id);

          values.unitPrice = charge.charge.price;
          const maxPriceAdjustment = selectedTest.priceAdjustment || PaymentService.DEFAULT_MAX_PRICE_ADJUSTMENT;
          const [maxDiscount, maxIncrease] = this.paymentService.convertPriceAdjustmentToAbsolutePriceAdjustment(
            values.unitPrice,
            maxPriceAdjustment
          );
          values.paymentType = maxPriceAdjustment.paymentType;
          values.price = values.quantity * values.unitPrice;
          const totalPrice = this.paymentService.calculateTotalPrice(
            values.unitPrice,
            values.quantity,
            values.discount,
            values.increase,
            values.paymentType
          );
          const taxIncluded = false; //charge.charge.taxIncluded;
          item.patchValue(
            {
              itemId: selectedTest.id,
              testCodes: { value: categoryFilteredTest },
              testCode,
              testNames: { value: categoryFilteredTest },
              testName,
              labs: { value: labs },
              lab,
              plans: { value: plans },
              plan,
              unitPrice: values.unitPrice,
              unitPriceStr: `$${values.unitPrice.toFixed(2)}`,
              maxDiscount: new MaxDiscountClass(maxDiscount, maxIncrease, values.paymentType),
              price: values.price,
              priceStr: `$${(values.price * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`,
              taxIncluded,
              adjustTotalPrice: `$${(totalPrice * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`
            },
            { emitEvent: false }
          );

          const formArray = item.parent as FormArray;
          const index = formArray.controls.indexOf(item);
          const info = this.consultationInfo.issuedMedicalTest.issuedMedicalTestDetails[index];
          const updatedInfo = <any>{
            testId: selectedTest.id,
            suggestedLocation: lab,
            priceAdjustment: {
              decreaseValue: 0,
              increaseValue: 0,
              paymentType: maxPriceAdjustment.paymentType,
              remarks: ''
            },
            excludedCoveragePlanIds: []
          };

          const discountGiven = updatedInfo.priceAdjustment;
          this.paymentService.updateDiscountGiven(discountGiven, values);
          this.paymentService.updateExcludedCoveragePlanIds(updatedInfo, excludedPlans);
          if (!info) {
            this.consultationInfo.issuedMedicalTest.issuedMedicalTestDetails.push(updatedInfo);
          } else {
            Object.assign(info, updatedInfo);
          }
          this.paymentService.setConsultationInfo(this.consultationInfo);
          this.updatePrice.next();

          this.paymentService.setMedicalTestFormGroup(this.medicalTestFormGroup);
        },
        err => {
          this.alertService.error(JSON.stringify(err.error.message));
        }
      );
  }

  newMedicalTestArrayItem(): FormGroup {
    const dosageType = 'TUB(s)';
    const item = this.fb.group(
      {
        itemId: '',
        quantity: 1,

        ...this.paymentService.newArrayItemCommonValue(),

        categories: { value: this.medicatTestCategory },
        category: '',
        testCodes: { value: this.medicalTests },
        testCode: '',
        testNames: { value: this.medicalTests },
        testName: '',
        labs: { value: [] },
        lab: ''
      },
      { validator: this.paymentService.validateDiscount }
    );

    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = this.visitCoverageArray.map(val => val.planDetail.id);
    item
      .get('category')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        item.get('plans').patchValue(plans);
        item.get('plan').patchValue(plan);
      });

    item
      .get('testCode')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged())
      .subscribe(testId => {
        const test = this.medicalTests.find(test => test.id === testId);
        if (test) {
          item.patchValue({
            category: test.category,
            testName: test.id
          });
        }
      });

    item
      .get('testName')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged())
      .subscribe(testId => {
        const test = this.medicalTests.find(test => test.id === testId);
        if (test) {
          item.patchValue({
            category: test.category,
            testCode: test.id
          });
        }
      });

    item.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.subscribeMedicalTestArrayItemValueChanges(item, values));

    return item;
  }

  formatMedicalTestsToFormGroup(medicalTest, priceInfo): FormGroup {
    const detail = this.store.getMedicalTestList().find(detail => detail.id === medicalTest.testId);

    const dosageType = 'TUB(s)';

    const quantity = 1;
    const unitPrice = priceInfo.charge.price;
    const unitPriceStr = `$${unitPrice.toFixed(2)}`;
    const taxIncluded = false; //priceInfo.charge.taxIncluded;
    const price = unitPrice * quantity;
    const priceStr = `$${(price * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`;
    const maxPriceAdjustment = detail.priceAdjustment || PaymentService.DEFAULT_MAX_PRICE_ADJUSTMENT;
    const [maxDiscount, maxIncrease] = this.paymentService.convertPriceAdjustmentToAbsolutePriceAdjustment(
      unitPrice,
      maxPriceAdjustment
    );
    const [discount, increase] = this.paymentService.convertDiscountToAbsoluteDiscount(
      unitPrice,
      medicalTest.priceAdjustment || PaymentService.DEFAULT_PRICE_ADJUSTMENT,
      maxPriceAdjustment
    );
    const paymentType = maxPriceAdjustment.paymentType;
    const totalPrice = this.paymentService.calculateTotalPrice(unitPrice, quantity, discount, increase, paymentType);
    const adjustTotalPrice = `$${(totalPrice * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`;

    const stock = 9999;
    const remarks = medicalTest.priceAdjustment.remark;

    const category = detail.category;
    const categoryFilteredMedicalTest = this.filterTestByCategory(category);

    const testCode = detail.id;
    const testName = detail.id;
    const labs = detail.laboratories.map(lab => {
      const label = lab.name;
      return {
        value: label,
        label
      };
    });
    const lab = labs[0].value;
    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = this.visitCoverageArray.map(val => val.planDetail.id);

    const item = this.fb.group(
      {
        itemId: medicalTest.testId,
        quantity,

        ...this.paymentService.formatArrayItemCommonValue(
          unitPrice,
          unitPriceStr,
          discount,
          increase,
          maxDiscount,
          maxIncrease,
          paymentType,
          price,
          priceStr,
          taxIncluded,
          adjustTotalPrice,
          stock,
          remarks,
          plans,
          plan // --> patch value below
        ),

        categories: { value: this.medicatTestCategory },
        category,
        testCodes: { value: categoryFilteredMedicalTest },
        testCode,
        testName,
        testNames: { value: categoryFilteredMedicalTest },
        labs: { value: labs },
        lab
      },
      { validator: this.paymentService.validateDiscount }
    );
    item.patchValue({ plan });

    item
      .get('testCode')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged())
      .subscribe(testId => {
        const test = this.medicalTests.find(test => test.id === testId);
        if (test) {
          item.patchValue({
            category: test.category,
            testName: test.id
          });
        }
      });

    item
      .get('testName')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged())
      .subscribe(testId => {
        const test = this.medicalTests.find(test => test.id === testId);
        if (test) {
          item.patchValue({
            category: test.category,
            testCode: test.id
          });
        }
      });

    item.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.subscribeMedicalTestArrayItemValueChanges(item, values));

    return item;
  }

  filterTestByCategory(category: string): Array<MedicalTest> {
    return this.store.getMedicalTestList().filter(medicalTest => medicalTest.category === category);
  }
}
