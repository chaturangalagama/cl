import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { Subject } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { StoreService } from '../../../services/store.service';
import { AlertService } from '../../../services/alert.service';
import { PaymentService } from '../../../services/payment.service';
import { ApiPatientVisitService } from '../../../services/api-patient-visit.service';
import { Subscription } from '../../../../../node_modules/rxjs';
import { MaxDiscountClass } from '../../../objects/response/MaxDiscount';

@Component({
  selector: 'app-payment-medical-service',
  templateUrl: './payment-medical-service.component.html',
  styleUrls: ['./payment-medical-service.component.scss']
})
export class PaymentMedicalServiceComponent implements OnInit {
  @Input() medicalServiceFormGroup: FormGroup;
  visitCoverageArray;

  consultationInfo;
  consultationInfoSubscription: Subscription;
  updatePrice: Subject<any> = new Subject();

  constructor(
    private store: StoreService,
    private alertService: AlertService,
    private paymentService: PaymentService,
    private apiPatientVisitService: ApiPatientVisitService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
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

  toggleDiscount(form: FormGroup) {
    form.patchValue({
      isCollapsed: !form.value.isCollapsed
    });
  }

  subscibeMedicalServiceArrayItemValueChanges(item: FormGroup, values) {
    if (values.isDelete) {
      this.consultationInfo.medicalServiceGiven.medicalServices.splice(values.deleteIndex, 1);
      this.paymentService.setConsultationInfo(this.consultationInfo);
      this.updatePrice.next();
      return;
    }

    const detail = this.store.getMedicalServiceList().find(detail => detail.id === values.category);
    if (!detail) {
      return;
    }

    const serviceNames = detail.medicalServiceItemList.map(medicalServiceItem => {
      return {
        value: medicalServiceItem.name,
        label: medicalServiceItem.name
      };
    });
    const itemDetail =
      detail.medicalServiceItemList.find(itemDetail => itemDetail.name === values.serviceName) ||
      detail.medicalServiceItemList[0];
    const serviceName = itemDetail.name;

    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = values.plan;
    const excludedPlans = plans.filter(obj => plan.indexOf(obj.value) < 0).map(val => val.value);
    console.log('Excluded Plan: ' + excludedPlans);
    const medicalChecklPaymentCheck: { itemId: string; excludedCoveragePlanIds: any }[] = [
      { itemId: itemDetail.id, excludedCoveragePlanIds: excludedPlans || [] }
    ];
    this.apiPatientVisitService
      .paymentCheckMedicalService(this.store.getPatientVisitRegistryId(), medicalChecklPaymentCheck)
      .subscribe(
        res => {
          const charge = res.payload.find(val => val.itemId === itemDetail.id);

          values.unitPrice = charge.charge.price;
          const maxPriceAdjustment = itemDetail.priceAdjustment || PaymentService.DEFAULT_MAX_PRICE_ADJUSTMENT;
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
              serviceId: detail.id,
              itemId: itemDetail.id.toString(),
              serviceNames: { value: serviceNames },
              serviceName,
              plans: { value: plans },
              plan,

              unitPrice: values.unitPrice,
              unitPriceStr: `$${values.unitPrice.toFixed(2)}`,
              maxDiscount: new MaxDiscountClass(maxDiscount, maxIncrease, values.paymentType),
              price: values.price,
              priceStr: `$${(values.price * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`,
              taxIncluded,
              adjustTotalPrice: `$${(totalPrice * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`,

              remarks: values.remarks
            },
            { emitEvent: false }
          );

          const formArray = item.parent as FormArray;
          const index = formArray.controls.indexOf(item);
          const info = this.consultationInfo.medicalServiceGiven.medicalServices[index];
          const updatedInfo = <any>{
            serviceId: detail.id,
            serviceItemId: itemDetail.id.toString(),
            priceAdjustment: {
              decreaseValue: 0,
              increaseValue: 0,
              paymentType: maxPriceAdjustment.paymentType,
              remarks: ''
            },
            name: serviceName,
            excludedCoveragePlanIds: []
          };
          const discountGiven = updatedInfo.priceAdjustment;
          this.paymentService.updateDiscountGiven(discountGiven, values);
          this.paymentService.updateExcludedCoveragePlanIds(updatedInfo, excludedPlans);
          if (!info) {
            this.consultationInfo.medicalServiceGiven.medicalServices.push(updatedInfo);
          } else {
            Object.assign(info, updatedInfo);
          }
          this.paymentService.setConsultationInfo(this.consultationInfo);
          this.updatePrice.next();

          const medicalServiceArray = item.parent as FormArray;
          const arrLength = medicalServiceArray.value.length;
          if (arrLength) {
            const lastItem = medicalServiceArray.value.slice(-1)[0];
            if (lastItem.itemId) {
              medicalServiceArray.push(this.newMedicalServiceArrayItem());
            }
          }
          this.paymentService.setMedicalServiceFormGroup(this.medicalServiceFormGroup);
        },
        err => {
          this.alertService.error(JSON.stringify(err.error.message));
        }
      );
  }

  newMedicalServiceArrayItem(): FormGroup {
    const dosageType = 'TUB(s)';

    const categories = this.store.getMedicalServiceListOptions();

    const item = this.fb.group(
      {
        serviceId: '',
        itemId: '',
        quantity: 1,

        ...this.paymentService.newArrayItemCommonValue(),

        categories: { value: categories },
        category: '',
        serviceNames: { value: [] },
        serviceName: ''
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
      .get('serviceName')
      .valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        item.get('plans').patchValue(plans);
        item.get('plan').patchValue(plan);
      });

    item.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.subscibeMedicalServiceArrayItemValueChanges(item, values));

    return item;
  }

  formatMedicalServicesToFormGroup(medicalService, priceInfo): FormGroup {
    const detail = this.store.getMedicalServiceList().find(detail => detail.id === medicalService.serviceId);
    const itemDetail = detail.medicalServiceItemList.find(itemDetail => itemDetail.id === medicalService.serviceItemId);

    const dosageType = 'TUB(s)';

    const quantity = 1;
    const unitPrice = priceInfo.charge.price;
    const unitPriceStr = `$${unitPrice.toFixed(2)}`;
    const taxIncluded = false; //priceInfo.charge.taxIncluded;
    const price = unitPrice * quantity;
    const priceStr = `$${(price * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`;
    const maxPriceAdjustment = itemDetail.priceAdjustment || PaymentService.DEFAULT_MAX_PRICE_ADJUSTMENT;
    const [maxDiscount, maxIncrease] = this.paymentService.convertPriceAdjustmentToAbsolutePriceAdjustment(
      unitPrice,
      maxPriceAdjustment
    );
    const [discount, increase] = this.paymentService.convertDiscountToAbsoluteDiscount(
      unitPrice,
      medicalService.priceAdjustment || PaymentService.DEFAULT_PRICE_ADJUSTMENT,
      maxPriceAdjustment
    );
    const paymentType = maxPriceAdjustment.paymentType;
    const totalPrice = this.paymentService.calculateTotalPrice(unitPrice, quantity, discount, increase, paymentType);
    const adjustTotalPrice = `$${(totalPrice * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`;

    const stock = 9999;
    const remarks = medicalService.priceAdjustment.remark;

    const categories = this.store.getMedicalServiceListOptions();
    const category = detail.id;
    const serviceNames = detail.medicalServiceItemList.map(medicalServiceItem => {
      return {
        value: medicalServiceItem.name,
        label: medicalServiceItem.name
      };
    });
    const serviceName = medicalService.name;
    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = this.visitCoverageArray.map(val => val.planDetail.id);

    const item = this.fb.group(
      {
        serviceId: medicalService.serviceId,
        itemId: medicalService.serviceItemId,
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

        categories: { value: categories },
        category,
        serviceNames: { value: serviceNames },
        serviceName
      },
      { validator: this.paymentService.validateDiscount }
    );

    item.patchValue({ plan });

    item.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => this.subscibeMedicalServiceArrayItemValueChanges(item, values));

    return item;
  }
}
