import { FormGroup, FormControl, Validators, FormArray, FormBuilder, ValidatorFn, AbstractControl } from '@angular/forms';
import { Injectable } from '@angular/core';

@Injectable()
export class CaseChargeFormService {
  chargeItemDetails: FormArray;

  constructor(private fb: FormBuilder) {
  }

  resetForm() {
    if (this.chargeItemDetails)
      this.chargeItemDetails.controls = [];
  }

  addMultipleChargeItems(addNewRow: boolean, count: number) {
    if (!addNewRow)
      this.chargeItemDetails = null;
    for (let index = 0; index < count; index++) {
      this.initDrugDispatchDetails();
    }
    return this.chargeItemDetails;
  }

  addDrugDispatchDetails(
    drugId: FormControl,
    batchNumber: FormControl,
    expiryDate: FormControl,
    remark: FormControl,
    dose: FormGroup,
    dosageInstruction: FormGroup,
    instruction: FormGroup,
    priceAdjustment: FormGroup,
    medicalCoverage: FormGroup,
    purchaseQty: FormControl,
    duration: FormControl,
    stock: FormControl,
    inventoryInvalid: FormControl,
    excludedCoveragePlanIds: FormArray,
    cautionary: FormArray,
    salesItemCode: FormControl,
    cost: FormControl,
    isChecked: FormControl,
    unitPrice: FormGroup
  ) {
    const newDrugDispatchDetail = new FormGroup({
      drugId: drugId,
      batchNumber: batchNumber,
      expiryDate: expiryDate,
      remark: remark,
      dose: dose,
      dosageInstruction: dosageInstruction,
      instruction: instruction,
      priceAdjustment: priceAdjustment,
      attachedMedicalCoverages: medicalCoverage,
      purchaseQty: purchaseQty,
      duration: duration,
      stock: stock,
      inventoryInvalid: inventoryInvalid,
      excludedCoveragePlanIds: excludedCoveragePlanIds,
      cautionary: cautionary,
      salesItemCode: salesItemCode,
      cost: cost,
      isChecked: isChecked,
      unitPrice: unitPrice
    });

    if (this.chargeItemDetails) {
      this.chargeItemDetails.push(newDrugDispatchDetail);
    } else {
      this.chargeItemDetails = new FormArray([newDrugDispatchDetail]);
    }
  }

  initDrugDispatchDetails() {
    const dose = this.buildDose('', 0);
    const dosageInstruction = this.buildDoseInstruction('', '');
    const instruction = this.buildInstruction('', 0, '', '');
    const priceAdjustment = this.buildPriceAdjustment(0, 0, '', '');
    const medicalCoverages = this.buildAttachedMedicalCoverage('', '');
    const drugId = new FormControl('');
    const batchNumber = new FormControl('');
    const expiryDate = new FormControl('');
    const remark = new FormControl('');
    const purchaseQty = new FormControl('');
    const duration = new FormControl('');
    const stock = new FormControl('');
    const inventoryInvalid = new FormControl();
    const excludedCoveragePlanIds = this.fb.array([]);
    const cautionary = this.fb.array([]);
    const salesItemCode = new FormControl('');
    const cost = new FormControl('');
    const isChecked = new FormControl('');
    const unitPrice = this.buildUnitPrice('', false);

    this.addDrugDispatchDetails(
      drugId,
      batchNumber,
      expiryDate,
      remark,
      dose,
      dosageInstruction,
      instruction,
      priceAdjustment,
      medicalCoverages,
      purchaseQty,
      duration,
      stock,
      inventoryInvalid,
      excludedCoveragePlanIds,
      cautionary,
      salesItemCode,
      cost,
      isChecked,
      unitPrice
    );

    return this.chargeItemDetails;
  }

  buildDose(uom: string, quantity: number) {
    return this.fb.group({
      uom: this.fb.control(uom),
      quantity: this.fb.control(quantity)
    });
  }

  buildUnitPrice(price: string, taxIncluded: boolean){
    return this.fb.group({
      price: this.fb.control(price),
      taxIncluded: this.fb.control(taxIncluded)
    });
  }

  buildDoseInstruction(code: string, instruct: string) {
    return new FormGroup({ code: new FormControl(code), instruct: new FormControl(instruct) });
  }

  buildInstruction(code: string, frequencyPerDay: number, instruct: string, cautionary: string) {
    return new FormGroup({
      code: new FormControl(code),
      frequencyPerDay: new FormControl(frequencyPerDay),
      instruct: new FormControl(instruct),
      cautionary: new FormControl(cautionary)
    });
  }

  buildPriceAdjustment(decreaseValue: number, increaseValue: number, paymentType: string, remark: string) {
    return new FormGroup({
      decreaseValue: new FormControl(decreaseValue),
      increaseValue: new FormControl(increaseValue),
      paymentType: new FormControl(paymentType),
      remark: new FormControl(remark)
    });
  }

  buildAttachedMedicalCoverage(medicalCoverageId: string, planId: string) {
    return new FormGroup({
      medicalCoverageId: new FormControl(medicalCoverageId),
      planId: new FormControl(planId)
    });
  }
}

export function mulitplierValidator(multiplier: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    return (control.value * 1000) % (multiplier * 1000) != 0
      ? { multiplierError: { multiplier: multiplier } }
      : null;
  };
}
