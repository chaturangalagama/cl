import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';

import { DISPLAY_DATE_FORMAT } from '../../../constants/app.constants';
import { Subscription, Subject } from '../../../../../node_modules/rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { StoreService } from '../../../services/store.service';
import { PaymentService } from '../../../services/payment.service';
import { ApiPatientVisitService } from '../../../services/api-patient-visit.service';
import { AlertService } from '../../../services/alert.service';
import { MaxDiscountClass } from '../../../objects/response/MaxDiscount';
import * as moment from 'moment';

@Component({
  selector: 'app-payment-immunization',
  templateUrl: './payment-immunization.component.html',
  styleUrls: ['./payment-immunization.component.scss']
})
export class PaymentImmunizationComponent implements OnInit {
  @Input()
  immunizationFormGroup: FormGroup;

  visitCoverageArray;

  consultationInfo;
  consultationInfoSubscription: Subscription;
  updatePrice: Subject<any> = new Subject();

  isDiscountShown = false;

  minDate: Date;

  constructor(
    private alertService: AlertService,
    private store: StoreService,
    private paymentService: PaymentService,
    private apiPatientVisitService: ApiPatientVisitService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.minDate = new Date();

    this.visitCoverageArray = this.paymentService.visitCoverageArray;

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

  onClick(form: FormGroup) {
    // this.isDiscountShown = !this.isDiscountShown;

    form.patchValue({
      isCollapsed: !form.value.isCollapsed
    });
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

  subscribeImmunizationArrayItemValueChanges(item: FormGroup, values) {
    values.nextDose = values.nextDose ? values.nextDose + '' : '';

    if (values.nextDose || values.nextDose !== '') {
      values.nextDose = moment(values.nextDose, 'DD-MM-YYYY', true).isValid()
        ? values.nextDose
        : moment(values.nextDose).format(DISPLAY_DATE_FORMAT);
    } else {
      values.nextDose = '';
    }

    if (values.isDelete) {
      this.consultationInfo.immunisationGiven.immunisation.splice(values.deleteIndex, 1);
      this.paymentService.setConsultationInfo(this.consultationInfo);
      this.updatePrice.next();
      return;
    }

    const detail = this.store.getVacinnationList().find(detail => detail.id === values.vaccine);
    if (!detail) {
      return;
    }

    const doseDetail = detail.doses
      ? detail.doses.find(doseDetail => doseDetail.doseId === values.dose)
        ? detail.doses.find(doseDetail => doseDetail.doseId === values.dose)
        : detail.doses[0]
      : {
          doseId: '',
          description: '',
          priceAdjustment: PaymentService.DEFAULT_PRICE_ADJUSTMENT
        };
    const doses = detail.doses
      ? detail.doses.map(dose => {
          return {
            value: dose.doseId,
            label: dose.name
          };
        })
      : [];
    const dose = doseDetail.doseId || '';
    const description = doseDetail.description || '';
    // const age = detail.ageInMonths;

    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = values.plan as String[];
    const excludedPlans = plans.filter(obj => plan.indexOf(obj.value) < 0).map(val => val.value);
    console.log('Excluded Plan: ' + excludedPlans);
    const vaccinationPaymentCheck: { itemId: string; excludedCoveragePlanIds: any }[] = [
      { itemId: dose, excludedCoveragePlanIds: excludedPlans || [] }
    ];
    this.apiPatientVisitService
      .paymentCheckVaccination(this.store.getPatientVisitRegistryId(), vaccinationPaymentCheck)
      .subscribe(
        res => {
          const charge = res.payload.find(val => val.itemId === dose);
          values.unitPrice = charge.charge.price;
          const maxPriceAdjustment = doseDetail.priceAdjustment || PaymentService.DEFAULT_MAX_PRICE_ADJUSTMENT;
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
              itemId: dose,
              doses: { value: doses },
              dose,
              description,
              // age,
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
          const info = this.consultationInfo.immunisationGiven.immunisation[index];
          const updatedInfo = <any>{
            immunisationDate: moment(new Date()).format(DISPLAY_DATE_FORMAT),
            batchNumber: values.batchNo,
            // nextDose: values.nextDose ? moment(values.nextDose).format(DISPLAY_DATE_FORMAT) : '',
            nextDose: values.nextDose ? values.nextDose : '',
            priceAdjustment: {
              decreaseValue: 0,
              increaseValue: 0,
              paymentType: maxPriceAdjustment.paymentType,
              remarks: ''
            },
            vaccinationId: detail.id,
            doseId: doseDetail.doseId,
            excludedCoveragePlanIds: []
          };

          const discountGiven = updatedInfo.priceAdjustment;
          this.paymentService.updateDiscountGiven(discountGiven, values);
          this.paymentService.updateExcludedCoveragePlanIds(updatedInfo, excludedPlans);
          if (!info) {
            this.consultationInfo.immunisationGiven.immunisation.push(updatedInfo);
          } else {
            Object.assign(info, updatedInfo);
          }
          this.paymentService.setConsultationInfo(this.consultationInfo);
          this.updatePrice.next();

          this.paymentService.setImmunizationFormGroup(this.immunizationFormGroup);
        },
        err => {
          this.alertService.error(JSON.stringify(err.error.message));
        }
      );
  }

  newImmunizationArrayItem(): FormGroup {
    const dosageType = 'VIA(s)';

    const vaccines = this.store.getVaccinationListOptions();

    const item = this.fb.group(
      {
        itemId: '',
        age: { value: '', disabled: true },
        nextDose: '',
        quantity: 1,

        ...this.paymentService.newArrayItemCommonValue(),

        batchNo: '',

        vaccines: { value: vaccines },
        vaccine: '',
        doses: { value: [] },
        dose: '',
        description: ''
      },
      { validator: this.paymentService.validateDiscount }
    );

    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = this.visitCoverageArray.map(val => val.planDetail.id);

    item
      .get('vaccine')
      .valueChanges.pipe(
        debounceTime(50),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(values => {
        item.get('plans').patchValue(plans);
        item.get('plan').patchValue(plan);
      });

    item.valueChanges
      .pipe(
        debounceTime(50),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(values => this.subscribeImmunizationArrayItemValueChanges(item, values));

    return item;
  }

  formatImmunizationToFormGroup(vaccination, priceInfo): FormGroup {
    const detail = this.store.getVacinnationList().find(detail => detail.id === vaccination.vaccinationId);
    const doseDetail = detail.doses.find(doseDetail => doseDetail.doseId === vaccination.doseId);

    const dosageType = 'VIA(s)';
    const nextDose = vaccination.nextDose ? vaccination.nextDose : '';

    const quantity = 1;
    const unitPrice = priceInfo.charge.price;
    const unitPriceStr = `$${unitPrice.toFixed(2)}`;
    const taxIncluded = false; //priceInfo.charge.taxIncluded;
    const price = unitPrice * quantity;
    const priceStr = `$${(price * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`;
    const maxPriceAdjustment = doseDetail.priceAdjustment || PaymentService.DEFAULT_MAX_PRICE_ADJUSTMENT;
    const [maxDiscount, maxIncrease] = this.paymentService.convertPriceAdjustmentToAbsolutePriceAdjustment(
      unitPrice,
      maxPriceAdjustment
    );
    const [discount, increase] = this.paymentService.convertDiscountToAbsoluteDiscount(
      unitPrice,
      vaccination.priceAdjustment || PaymentService.DEFAULT_PRICE_ADJUSTMENT,
      maxPriceAdjustment
    );
    const paymentType = maxPriceAdjustment.paymentType;
    const totalPrice = this.paymentService.calculateTotalPrice(unitPrice, quantity, discount, increase, paymentType);
    const adjustTotalPrice = `$${(totalPrice * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`;

    const batchNo = vaccination.batchNumber;
    const stock = 9999;
    const remarks = vaccination.priceAdjustment.remark;

    const vaccines = this.store.getVaccinationListOptions();
    const vaccine = detail.id;
    const doses = detail.doses.map(dose => {
      return {
        value: dose.doseId,
        label: dose.name
      };
    });
    const dose = doseDetail.doseId;
    const description = doseDetail.description;
    const age = detail.ageInMonths;

    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = this.visitCoverageArray.map(val => val.planDetail.id);

    const item = this.fb.group(
      {
        itemId: vaccination.doseId,
        age: { value: age === -1 ? '' : age, disabled: true },
        nextDose,
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

        batchNo,

        vaccines: { value: vaccines },
        vaccine,
        doses: { value: doses },
        dose,
        description
      },
      { validator: this.paymentService.validateDiscount }
    );

    item.patchValue({ plan });

    item.valueChanges
      .pipe(
        debounceTime(50),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(values => this.subscribeImmunizationArrayItemValueChanges(item, values));

    return item;
  }
}
