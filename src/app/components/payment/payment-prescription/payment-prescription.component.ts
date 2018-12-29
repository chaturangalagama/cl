import { AlertService } from './../../../services/alert.service';
import { ApiPatientInfoService } from './../../../services/api-patient-info.service';
import { StoreService } from './../../../services/store.service';
import { PaymentService } from '../../../services/payment.service';
import * as moment from 'moment';
import { DISPLAY_DATE_FORMAT } from '../../../constants/app.constants';
import { ApiPatientVisitService } from '../../../services/api-patient-visit.service';
import { DosageInstruction, Instruction, DrugItem } from '../../../objects/DrugItem';
import { MaxDiscountClass } from '../../../objects/response/MaxDiscount';
import { mulitplierValidator } from '../../../services/consultation-form.service';
import { Uom } from '../../../objects/Uom';

import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';

import { Subscription, Subject } from '../../../../../node_modules/rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-payment-prescription',
  templateUrl: './payment-prescription.component.html',
  styleUrls: ['./payment-prescription.component.scss']
})
export class PaymentPrescriptionComponent implements OnInit {
  @Input()
  prescriptionFormGroup: FormGroup;
  @Input()
  errors;

  visitCoverageArray;

  consultationInfo;
  consultationInfoSubscription: Subscription;
  updatePrice: Subject<any> = new Subject();

  dosageMin = 1;

  constructor(
    private store: StoreService,
    private apiPatientInfoService: ApiPatientInfoService,
    private apiPatientVisitService: ApiPatientVisitService,
    private paymentService: PaymentService,
    private alertService: AlertService,
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

  toggleDiscount(form) {
    form.patchValue(
      {
        isCollapsed: !form.value.isCollapsed
      },
      { emitEvent: false }
    );
  }

  subscribeDrugArrayItemValueChanges(item, values) {
    if (values.isDelete) {
      this.consultationInfo.drugDispatch.dispatchDrugDetail.splice(values.deleteIndex, 1);
      this.paymentService.setConsultationInfo(this.consultationInfo);
      this.updatePrice.next();
      return;
    }

    const detail = this.store.getDrugList().find(detail => detail.id === values.drugCode);
    if (!detail) {
      return;
    }

    const formArray = item.parent as FormArray;
    const index = formArray.controls.indexOf(item);

    if (values.isInventoryChange) {
      const info = this.consultationInfo.drugDispatch.dispatchDrugDetail[index];
      info.batchNumber = values.batchNo;
      info.expiryDate = moment(values.expiryDate, DISPLAY_DATE_FORMAT).format(DISPLAY_DATE_FORMAT);
      return;
    }

    const drugName = detail.name;
    const dosageType = detail.uom;

    this.setDosageValidators(item, detail);

    const dosageInsturctionsDetail = (values.dosageInstructions.value || []).find(
      instruction => instruction.code === values.dosageInstruction
    ) || {
      code: '',
      instruct: ''
    };

    const instructionDetail = (values.instructions.value || []).find(
      instruction => instruction.code === values.instruction
    ) || {
      instruct: '',
      cautionary: '',
      frequencyPerDay: 0
    };
    const instructionStr = instructionDetail.instruct || '';
    const cautionaryStr = (detail.cautionary || []).join('\n') || '';

    const quantity = values.quantity;

    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = values.plan;
    const excludedPlans = plans.filter(obj => plan.indexOf(obj.value) < 0).map(val => val.value);
    console.log('Excluded Plan: ' + excludedPlans);
    const drugPaymentCheck: { itemId: string; excludedCoveragePlanIds: any }[] = [
      { itemId: detail.id, excludedCoveragePlanIds: excludedPlans || [] }
    ];
    this.apiPatientVisitService.paymentCheckDrug(this.store.getPatientVisitRegistryId(), drugPaymentCheck).subscribe(
      res => {
        const charge = res.payload.find(val => val.itemId === detail.id);

        const unitPrice = charge.charge.price;
        const maxPriceAdjustment = detail.priceAdjustment || PaymentService.DEFAULT_MAX_PRICE_ADJUSTMENT;
        const [maxDiscount, maxIncrease] = this.paymentService.convertPriceAdjustmentToAbsolutePriceAdjustment(
          unitPrice,
          maxPriceAdjustment
        );
        const paymentType = maxPriceAdjustment.paymentType;
        const price = quantity * unitPrice;
        const totalPrice = this.paymentService.calculateTotalPrice(
          unitPrice,
          quantity,
          values.discount,
          values.increase,
          paymentType
        );
        const taxIncluded = false; //charge.charge.taxIncluded;
        item.patchValue(
          {
            itemId: detail.id,
            drugName,
            dosageType,
            quantity,
            plans: { value: plans },
            plan,

            unitPrice,
            unitPriceStr: `$${unitPrice.toFixed(2)}`,
            maxDiscount: new MaxDiscountClass(maxDiscount, maxIncrease, paymentType),
            price,
            priceStr: `$${(price * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`,
            taxIncluded,
            adjustTotalPrice: `$${(totalPrice * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`
          },
          { emitEvent: false }
        );

        this.prescriptionFormGroup.patchValue(
          {
            charge: `${drugName} / ${quantity ? quantity : 0} ${dosageType}`,
            sig: instructionStr,
            dosageInstruction: values.dosage
              ? dosageInsturctionsDetail.instruct.replace('#', values.dosage)
              : dosageInsturctionsDetail.instruct,
            cautionary: cautionaryStr,
            remarks: values.remarks
          },
          { emitEvent: false }
        );

        const info = this.consultationInfo.drugDispatch.dispatchDrugDetail[index];
        const updatedInfo = <any>{
          drugId: detail.id,
          name: drugName,
          dose: {
            uom: dosageType,
            quantity: parseFloat(values.dosage) || 0
          },
          dosageInstruction: dosageInsturctionsDetail,
          instruction: instructionDetail,
          batchNumber: values.batchNo,
          expiryDate: moment(values.expiryDate, DISPLAY_DATE_FORMAT).format(DISPLAY_DATE_FORMAT),
          remark: values.remarks,
          duration: values.duration,
          quantity,
          priceAdjustment: {
            decreaseValue: 0,
            increaseValue: 0,
            paymentType: maxPriceAdjustment.paymentType,
            remarks: ''
          },
          isAllergic: false,
          excludedCoveragePlanIds: []
        };
        const discountGiven = updatedInfo.priceAdjustment;
        this.paymentService.updateDiscountGiven(discountGiven, values);
        this.paymentService.updateExcludedCoveragePlanIds(updatedInfo, excludedPlans);
        if (!info) {
          this.consultationInfo.drugDispatch.dispatchDrugDetail.push(updatedInfo);
        } else {
          Object.assign(info, updatedInfo);
        }
        console.log(updatedInfo);
        this.paymentService.setConsultationInfo(this.consultationInfo);
        this.updatePrice.next();

        const drugArray = item.parent as FormArray;
        const arrLength = drugArray.value.length;
        if (arrLength) {
          const lastItem = drugArray.value.slice(-1)[0];
          if (lastItem.itemId) {
            drugArray.push(this.newDrugArrayItem());
          }
        }

        this.paymentService.setPrescriptionFormGroup(this.prescriptionFormGroup);
        const drugUsage = {
          inventoryType: 'DRUG',
          itemId: detail.id,
          quantity
        };
        this.apiPatientVisitService.getInventory(this.store.getClinicId(), [drugUsage]).subscribe(
          res => {
            const inventories = res.payload;
            const inventory = inventories.find(inventory => inventory.itemId === detail.id);

            const batchNo = inventory.batchNo || '';
            const stock = inventory.remainingQuantity;
            const isDateValid = moment(inventory.expiryDate, DISPLAY_DATE_FORMAT).isValid();
            const expiryDate = isDateValid
              ? moment(inventory.expiryDate, 'YYYY-MM-DD').format(DISPLAY_DATE_FORMAT)
              : moment(new Date()).format(DISPLAY_DATE_FORMAT);

            // Inventory Invalid msg will be shown if any field is mising
            const inventoryInvalid = batchNo && expiryDate && stock ? false : true;

            item.patchValue(
              {
                batchNo,
                expiryDate,
                stock,
                inventoryInvalid,
                inventoryNotFound: false
              },
              { emitEvent: false }
            );

            updatedInfo.batchNumber = batchNo;
            updatedInfo.expiryDate = expiryDate;
            this.setInventoryValidator(item);
          },
          err => {
            item.patchValue(
              {
                // batchNo: '',
                expiryDate: moment(new Date()).format(DISPLAY_DATE_FORMAT),
                stock: 9999,
                inventoryInvalid: false,
                inventoryNotFound: true
              },
              { emitEvent: false }
            );

            updatedInfo.batchNumber = item.get('batchNo').value;
            updatedInfo.expiryDate = moment(new Date()).format(DISPLAY_DATE_FORMAT);
            this.setInventoryValidator(item);
          }
        );
      },
      err => this.alertService.error(JSON.stringify(err.error.message))
    );
  }

  subscribeDrugArrayItemTouch(item: FormGroup, values) {
    const detail = this.store.getDrugList().find(detail => detail.id === values.drugCode);
    if (!detail) {
      return;
    }

    const formArray = item.parent as FormArray;
    if (!formArray || !formArray.value) {
      return;
    }
    const index = formArray.value.map(itemValues => JSON.stringify(itemValues)).indexOf(JSON.stringify(values));

    const drugName = detail.name;
    const dosageType = detail.uom;

    const dosageInstructions = this.getSortedDosageInstructionArray(values.dosageInstruction);
    const dosageInstruction =
      dosageInstructions.find(instruction => instruction.code === values.dosageInstruction) || dosageInstructions[0];
    const dosageInstructionStr = (dosageInstruction.instruct || '').replace('#', values.dosage);

    const instructions = this.getSortedInstructionArray(values.instructions);
    const instructionDetail = instructions.find(instruction => instruction.code === values.instruction) || {
      instruct: '',
      cautionary: '',
      frequencyPerDay: 0,
      code: ''
    };

    // const plan = values.plan || plans[0].value;
    const instructionStr = instructionDetail.instruct || '';
    const cautionaryStr = (detail.cautionary || []).join('\n') || '';

    this.prescriptionFormGroup.patchValue(
      {
        charge: `${drugName} / ${values.quantity ? values.quantity : 0} ${dosageType}`,
        dosageInstruction: dosageInstructionStr,
        sig: instructionStr,
        cautionary: cautionaryStr,
        remarks: values.remarks
      },
      { emitEvent: false }
    );

    // item.get('dosage').patchValue(detail.recommendedDose);

    if (item.get('instruction').value === '' || item.get('instruction').value === undefined) {
      item.get('instruction').patchValue(instructions[0].code);
    }

    if (item.get('dosageInstruction').value === '' || item.get('dosageInstruction').value === undefined) {
      item.get('dosageInstruction').patchValue(dosageInstructions[0].code);
    }

    if (item.get('expiryDate').value === '' || item.get('expiryDate').value === undefined) {
      item
        .get('expiryDate')
        .patchValue(moment(new Date(), DISPLAY_DATE_FORMAT).format(DISPLAY_DATE_FORMAT), { emitEvent: false });
    }
    // this.setMandatoryFields(item);
  }

  subscribeDrugArrayItemDrugCodeChanges(item: FormGroup, values) {
    const detail = this.store.getDrugList().find(detail => detail.id === values);
    if (!detail) {
      return;
    }

    console.log('durg code change', detail);
    this.apiPatientInfoService.checkAllergies(this.store.getPatientId(), [values]).subscribe(
      res => {
        if (res.payload.includes(values)) {
          item.get('isAllergic').patchValue(true, { emitEvent: false });
        } else {
          this.errors = [];
        }
      },
      err => this.alertService.error(JSON.stringify(err.error.message))
    );

    const dosageInstructions = this.getSortedDosageInstructionArray(
      (detail.dosageInstruction || { code: '' }).code || ''
    );
    const instructions = this.getSortedInstructionArray((detail.instruction || { code: '' }).code || '');

    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = this.visitCoverageArray.map(val => val.planDetail.id);
    item.get('plans').patchValue(plans, { emitEvent: false });
    item.get('plan').patchValue(plan, { emitEvent: false });
    // item.get('drugCode').patchValue(values.drugCode, { emitEvent: false });
    item.get('dosage').patchValue(detail.recommendedDose, { emitEvent: false });
    item.get('instructions').patchValue({ value: instructions }, { emitEvent: false });
    item.get('instruction').patchValue(instructions[0].code, { emitEvent: false });
    item.get('dosageInstructions').patchValue({ value: dosageInstructions }, { emitEvent: false });
    item.get('quantity').patchValue(detail.standardDispenseAmount || 0, { emitEvent: false });
    item.get('dosageInstruction').patchValue(dosageInstructions[0].code, { emitEvent: false });
    item.get('batchNo').patchValue('', { emitEvent: false });
    item
      .get('expiryDate')
      .patchValue(moment(new Date(), DISPLAY_DATE_FORMAT).format(DISPLAY_DATE_FORMAT), { emitEvent: false });
    this.setMandatoryFields(item, detail);
  }

  setMandatoryFields(item: FormGroup, drugDetail: DrugItem) {
    item.get('instruction').setValidators([Validators.required]);
    item.get('instruction').markAsTouched();
    item.get('instruction').updateValueAndValidity();

    this.setDosageValidators(item, drugDetail);

    item.get('quantity').setValidators([Validators.required, Validators.min(1)]);
    item.get('quantity').markAsTouched();
    item.get('quantity').updateValueAndValidity();
  }

  setInventoryValidator(item: FormGroup) {
    item.get('expiryDate').setValidators([Validators.required]);
    item.get('expiryDate').markAsTouched();
    item.get('expiryDate').updateValueAndValidity({ emitEvent: false });

    item.get('batchNo').setValidators([Validators.required]);
    item.get('batchNo').markAsTouched();
    item.get('batchNo').updateValueAndValidity({ emitEvent: false });
  }

  setDosageValidators(item: FormGroup, drugDetail: DrugItem) {
    const uom: Uom = this.store.uoms.find(item => item.uom.toLowerCase() === drugDetail.uom.toLowerCase()) || new Uom();
    this.dosageMin = uom.multiply;

    const dosageInstruction: DosageInstruction = this.store
      .getDosageInstructions()
      .find(instruction => instruction.code === item.value.dosageInstruction);

    const dosageControl = item.get('dosage');

    if ((dosageInstruction || { instruct: '' }).instruct.includes('#')) {
      dosageControl.setValidators([
        Validators.required,
        Validators.min(this.dosageMin),
        mulitplierValidator(this.dosageMin)
      ]);
    } else {
      dosageControl.setValidators(null);
    }

    item.get('dosage').markAsTouched();
    item.get('dosage').updateValueAndValidity();
  }

  newDrugArrayItem(): FormGroup {
    const drugCodes = this.store.getDrugListOptions();

    const item = this.fb.group(
      {
        itemId: '',
        checkbox: true,
        drugName: '',
        dosage: '',
        dosageType: { value: '', disabled: true },
        dosageInstructions: { value: [] },
        dosageInstruction: '',
        duration: 0,
        quantity: 0,
        remarks: '',

        discountRemarks: '',

        ...this.paymentService.newArrayItemCommonValue(),

        batchNo: '',
        expiryDate: '', //moment(new Date()).format(DISPLAY_DATE_FORMAT),
        inventoryInvalid: false,
        inventoryNotFound: false,

        drugCodes: { value: drugCodes },
        drugCode: '',
        instructions: { value: [] },
        instruction: '',
        cautionary: '',
        isAllergic: false,

        touchTimes: 0,
        isQuantityChange: false,
        isInventoryChange: false
      },
      { validator: this.paymentService.validateDiscount }
    );

    let isTouchChangeFlag = false;
    item.get('touchTimes').valueChanges.subscribe(values => {
      isTouchChangeFlag = true;
      this.subscribeDrugArrayItemTouch(item, item.value);
    });

    let isDropdownChangeFlag = false;
    item.get('drugCode').valueChanges.subscribe(values => {
      isDropdownChangeFlag = true;
      this.subscribeDrugArrayItemDrugCodeChanges(item, values);
    });

    // Handle if user update quantity
    let isQuantityChangeFlag = false;
    item.get('quantity').valueChanges.subscribe(values => {
      isQuantityChangeFlag = true; //set the flag to update 'values.isQuantityChange' below
    });
    item.get('duration').valueChanges.subscribe(values => {
      isQuantityChangeFlag = false; //reset when duration is changed
    });
    item.get('instruction').valueChanges.subscribe(values => {
      isQuantityChangeFlag = false; //reset when instruction is changed
      isDropdownChangeFlag = true;
    });
    item.get('dosage').valueChanges.subscribe(values => {
      isQuantityChangeFlag = false; //reset when dosage is changed
    });
    item.get('dosageInstruction').valueChanges.subscribe(values => {
      isQuantityChangeFlag = false; //reset when dosage is changed
      isDropdownChangeFlag = true;
    });

    item.get('plan').valueChanges.subscribe(values => {
      isDropdownChangeFlag = true;
    });

    let isInventoryChangeFlag = false;
    item.get('batchNo').valueChanges.subscribe(values => {
      isInventoryChangeFlag = true;
    });
    item.get('expiryDate').valueChanges.subscribe(values => {
      isInventoryChangeFlag = true;
    });

    item.valueChanges.pipe(debounceTime(50)).subscribe(values => {
      values.isQuantityChange = isQuantityChangeFlag ? true : false;
      values.isInventoryChange = isInventoryChangeFlag ? true : false;
      isInventoryChangeFlag = false;
      if (!isTouchChangeFlag || isDropdownChangeFlag) {
        this.subscribeDrugArrayItemValueChanges(item, values);
      }
      isTouchChangeFlag = false;
      isDropdownChangeFlag = false;
    });

    return item;
  }

  formatDrugToFormGroup(drug, priceInfo, inventory): FormGroup {
    console.log(this.prescriptionFormGroup);
    const detail = this.store.getDrugList().find(detail => detail.id === drug.drugId);

    const drugName = drug.name;
    const dosage = drug.dose.quantity;
    const dosageType = drug.dose.uom;
    const dosageInstructions = this.getSortedDosageInstructionArray(drug.dosageInstruction.code);
    const dosageInstruction = drug.dosageInstruction.code || '';
    const duration = drug.duration;
    const drugRemark = drug.remark;

    const instructions = this.getSortedInstructionArray(drug.instruction.code);
    const instruction = drug.instruction.code;

    const quantity = drug.quantity;
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
      drug.priceAdjustment || PaymentService.DEFAULT_PRICE_ADJUSTMENT,
      maxPriceAdjustment
    );
    const paymentType = maxPriceAdjustment.paymentType;
    const totalPrice = this.paymentService.calculateTotalPrice(unitPrice, quantity, discount, increase, paymentType);
    const adjustTotalPrice = `$${(totalPrice * (taxIncluded ? 1 : 1 + PaymentService.GST_VALUE)).toFixed(2)}`;

    const batchNo = inventory.batchNo;
    const stock = inventory.remainingQuantity;
    const remarks = drug.priceAdjustment.remark;
    const expiryDate = inventory.expiryDate; //moment(inventory.expiryDate, DISPLAY_DATE_FORMAT).format(DISPLAY_DATE_FORMAT);

    const drugCodes = this.store.getDrugListOptions();
    const drugCode = detail.id;
    const plans = this.visitCoverageArray.map(val => ({ label: val.name, value: val.planDetail.id }));
    const plan = this.visitCoverageArray.map(val => val.planDetail.id);

    const item = this.fb.group(
      {
        itemId: drug.drugId,
        checkbox: true,
        drugName,
        dosage,
        dosageType: { value: dosageType, disabled: true },
        dosageInstructions: { value: dosageInstructions },
        dosageInstruction,
        duration,
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
          plan
        ),
        batchNo,
        expiryDate,
        inventoryInvalid: false,
        inventoryNotFound: false,
        remarks: drugRemark,

        drugCodes: { value: drugCodes },
        drugCode,
        instructions: { value: instructions },
        instruction,
        isAllergic: false,

        touchTimes: 0,
        isQuantityChange: false,
        isInventoryChange: false
      },
      { validator: this.paymentService.validateDiscount }
    );

    item.patchValue({ plan });

    let isTouchChangeFlag = false;
    item.get('touchTimes').valueChanges.subscribe(values => {
      isTouchChangeFlag = true;
      this.subscribeDrugArrayItemTouch(item, item.value);
    });

    let isDropdownChangeFlag = false;
    item.get('drugCode').valueChanges.subscribe(values => {
      isDropdownChangeFlag = true;
      this.subscribeDrugArrayItemDrugCodeChanges(item, values);
    });

    // Handle if user update quantity
    let isQuantityChangeFlag = false;
    item.get('quantity').valueChanges.subscribe(values => {
      isQuantityChangeFlag = true; //set the flag to update 'values.isQuantityChange' below
    });
    item.get('duration').valueChanges.subscribe(values => {
      isQuantityChangeFlag = false; //reset when duration is changed
    });
    item.get('instruction').valueChanges.subscribe(values => {
      isQuantityChangeFlag = false; //reset when instruction is changed
      isDropdownChangeFlag = true;
    });
    item.get('dosageInstruction').valueChanges.subscribe(values => {
      isQuantityChangeFlag = false; //reset when dosage is changed
      isDropdownChangeFlag = true;
    });
    item.get('dosage').valueChanges.subscribe(values => {
      isQuantityChangeFlag = false; //reset when dosage is changed
    });

    item.get('plan').valueChanges.subscribe(values => {
      isDropdownChangeFlag = true;
    });

    let isInventoryChangeFlag = false;
    item.get('batchNo').valueChanges.subscribe(values => {
      isInventoryChangeFlag = true;
    });
    item.get('expiryDate').valueChanges.subscribe(values => {
      isInventoryChangeFlag = true;
    });

    item.valueChanges.pipe(debounceTime(50)).subscribe(values => {
      values.isQuantityChange = isQuantityChangeFlag ? true : false;
      values.isInventoryChange = isInventoryChangeFlag ? true : false;
      isInventoryChangeFlag = false;
      if (!isTouchChangeFlag || isDropdownChangeFlag) {
        this.subscribeDrugArrayItemValueChanges(item, values);
      }
      isTouchChangeFlag = false;
      isDropdownChangeFlag = false;
    });

    return item;
  }

  getSortedDosageInstructionArray(selectedDosageInstructionCode: string): Array<DosageInstruction> {
    const instuctionList = this.store.getDosageInstructions();
    if (!selectedDosageInstructionCode) {
      return instuctionList;
    }

    const index = instuctionList.findIndex(detail => {
      return detail.code === selectedDosageInstructionCode;
    });
    if (index !== -1) {
      const selected = instuctionList.splice(index, 1);
      instuctionList.splice(0, 0, ...selected);
    }
    return instuctionList;
  }

  getSortedInstructionArray(selectedInstructionCode: string): Array<Instruction> {
    const instuctionList = this.store.getInstructions();
    if (!selectedInstructionCode) {
      return instuctionList;
    }

    const index = instuctionList.findIndex(detail => {
      return detail.code === selectedInstructionCode;
    });
    if (index !== -1) {
      const selected = instuctionList.splice(index, 1);
      instuctionList.splice(0, 0, ...selected);
    }
    return instuctionList;
  }
}
