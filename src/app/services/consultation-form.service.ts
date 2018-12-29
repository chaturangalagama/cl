import { DispatchDrugDetail } from './../objects/request/DrugDispatch';
import {
  FormGroup,
  FormControl,
  Validators,
  FormArray,
  FormBuilder,
  ValidatorFn,
  AbstractControl
} from '@angular/forms';
import { Injectable } from '@angular/core';
import { AstTransformer } from '@angular/compiler';
import { AtLeastOneFieldValidator } from '../validators/AtLeastOneValidator';
import { UtilsService } from './utils.service';

@Injectable()
export class ConsultationFormService {
  drugDispatchDetails: FormArray;
  medicalServiceGiven: FormArray;
  immunisation: FormArray;
  issuedMedicalTest: FormArray;
  diagnosis: FormArray;
  followupConsultation: FormGroup;

  patientReferral: FormArray;

  constructor(private fb: FormBuilder) {
    // this.drugDispatchDetails = new FormArray();
  }

  resetForm() {
    if (
      this.drugDispatchDetails &&
      this.medicalServiceGiven &&
      this.immunisation &&
      this.issuedMedicalTest &&
      this.diagnosis &&
      this.patientReferral
    ) {
      this.drugDispatchDetails.controls = [];
      this.medicalServiceGiven.controls = [];
      this.immunisation.controls = [];
      this.issuedMedicalTest.controls = [];
      this.diagnosis.controls = [];
      this.patientReferral.controls = [];
    }
  }

  buildPrescriptionItem() {}

  addNewDrugDispatchDetail(data: DispatchDrugDetail[]) {
    if (this.drugDispatchDetails) {
      // new test
      // console.log('DATA LENGTH', data.length);
      // // removing empty item
      // this.drugDispatchDetails.controls.map((element, index) => {
      //   // tempDrugDispatchDetails.push(element);
      //   if (element.pristine) {
      //     this.drugDispatchDetails.removeAt(index);
      //   }
      // });
      // // push into drugDispatchDetails
      // data.map(value => {
      //   this.drugDispatchDetails.push(this.newDrugDispatchFormGroup(value));
      // });

      // console.log('CONTROLS', this.drugDispatchDetails.controls);

      data.map(value => {
        this.drugDispatchDetails.insert(0, this.newDrugDispatchFormGroup(value));
      });
    }
  }

  newDrugDispatchFormGroup(data: DispatchDrugDetail) {
    return this.fb.group({
      drugId: data.drugId,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate,
      remark: data.remark,
      dose: this.fb.group(data.dose),
      dosageInstruction: data.dosageInstruction
        ? this.fb.group(data.dosageInstruction)
        : this.buildDoseInstruction('', ''),
      instruction: this.fb.group(data.instruction),
      priceAdjustment: data.priceAdjustment
        ? this.fb.group(data.priceAdjustment)
        : this.buildPriceAdjustment(0, 0, '', ''),
      // attachedMedicalCoverages: this.fb.group(data.attachedMedicalCoverages),
      quantity: data.quantity,
      duration: data.duration,
      stock: 9999,
      excludedCoveragePlanIds: [],
      cautionary: this.fb.array([])
    });
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
    quantity: FormControl,
    duration: FormControl,
    stock: FormControl,
    inventoryInvalid: FormControl,
    excludedCoveragePlanIds: FormArray,
    cautionary: FormArray
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
      quantity: quantity,
      duration: duration,
      stock: stock,
      inventoryInvalid: inventoryInvalid,
      excludedCoveragePlanIds: excludedCoveragePlanIds,
      cautionary: cautionary
    });

    if (this.drugDispatchDetails) {
      this.drugDispatchDetails.push(newDrugDispatchDetail);
    } else {
      this.drugDispatchDetails = new FormArray([newDrugDispatchDetail]);
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

    const quantity = new FormControl('');
    const duration = new FormControl('');
    const stock = new FormControl('');
    const inventoryInvalid = new FormControl();
    const excludedCoveragePlanIds = this.fb.array([]);
    const cautionary = this.fb.array([]);

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
      quantity,
      duration,
      stock,
      inventoryInvalid,
      excludedCoveragePlanIds,
      cautionary
    );

    return this.drugDispatchDetails;
  }

  addMultipleDrugDispatch(count: number) {
    for (let index = 0; index < count; index++) {
      this.initDrugDispatchDetails();
    }

    return this.drugDispatchDetails;
  }

  buildDose(uom: string, quantity: number) {
    return this.fb.group({
      uom: this.fb.control(uom),
      quantity: this.fb.control(quantity)
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

  /** Medical Service */
  initMedicalServiceGiven() {
    const serviceId = new FormControl('');
    const serviceItemId = new FormControl('');
    const priceAdjustment = this.buildPriceAdjustment(0, 0, '', '');
    const medicalCoverages = this.buildAttachedMedicalCoverage('', '');
    const excludedCoveragePlanIds = this.fb.array([]);

    this.addMedicalServiceGiven(serviceId, serviceItemId, priceAdjustment, medicalCoverages, excludedCoveragePlanIds);

    return this.medicalServiceGiven;
  }

  addMedicalServiceGiven(
    serviceId: FormControl,
    serviceItemId: FormControl,
    priceAdjustment: FormGroup,
    medicalCoverages: FormGroup,
    excludedCoveragePlanIds: FormArray
  ) {
    const newMedicalServiceGiven = new FormGroup({
      serviceId: serviceId,
      serviceItemId: serviceItemId,
      priceAdjustment: priceAdjustment,
      attachedMedicalCoverages: medicalCoverages,
      excludedCoveragePlanIds: excludedCoveragePlanIds
    });

    if (this.medicalServiceGiven) {
      this.medicalServiceGiven.push(newMedicalServiceGiven);
    } else {
      this.medicalServiceGiven = new FormArray([newMedicalServiceGiven]);
    }
  }

  addMultipleMedicalService(count: number) {
    for (let index = 0; index < count; index++) {
      this.initMedicalServiceGiven();
    }

    return this.medicalServiceGiven;
  }

  /** immunisation */
  initImmunisation() {
    const batchNumber = new FormControl('');
    const nextDose = new FormControl('');
    const vaccinationId = new FormControl('');
    const doseId = new FormControl('');
    const priceAdjustment = this.buildPriceAdjustment(0, 0, '', '');
    const medicalCoverages = this.buildAttachedMedicalCoverage('', '');
    const excludedCoveragePlanIds = this.fb.array([]);

    this.addImmunisation(
      batchNumber,
      nextDose,
      vaccinationId,
      doseId,
      priceAdjustment,
      medicalCoverages,
      excludedCoveragePlanIds
    );

    return this.immunisation;
  }

  addImmunisation(
    batchNumber: FormControl,
    nextDose: FormControl,
    vaccinationId: FormControl,
    doseId: FormControl,
    priceAdjustment: FormGroup,
    medicalCoverages: FormGroup,
    excludedCoveragePlanIds: FormArray
  ) {
    const newImmunisation = new FormGroup({
      batchNumber: batchNumber,
      nextDose: nextDose,
      vaccinationId: vaccinationId,
      doseId: doseId,
      priceAdjustment: priceAdjustment,
      attachedMedicalCoverages: medicalCoverages,
      excludedCoveragePlanIds: excludedCoveragePlanIds
    });

    if (this.immunisation) {
      this.immunisation.push(newImmunisation);
    } else {
      this.immunisation = new FormArray([newImmunisation]);
    }
  }

  addMultipleImmunisation(count: number) {
    for (let index = 0; index < count; index++) {
      this.initImmunisation();
    }

    return this.immunisation;
  }

  /** issuedMedicalTest */
  initIssuedMedicalTestDetails() {
    const testId = new FormControl('');
    const suggestedLocation = new FormControl('');

    const priceAdjustment = this.buildPriceAdjustment(0, 0, '', '');
    const attachedMedicalCoverages = this.buildAttachedMedicalCoverage('', '');
    const excludedCoveragePlanIds = this.fb.array([]);

    this.addIssuedMedicalTestDetails(
      testId,
      suggestedLocation,
      priceAdjustment,
      attachedMedicalCoverages,
      excludedCoveragePlanIds
    );

    return this.issuedMedicalTest;
  }

  addIssuedMedicalTestDetails(
    testId: FormControl,
    suggestedLocation: FormControl,
    priceAdjustment: FormGroup,
    attachedMedicalCoverages: FormGroup,
    excludedCoveragePlanIds: FormArray
  ) {
    const newIssuedMedicalTestDetails = new FormGroup({
      testId: testId,
      suggestedLocation: suggestedLocation,
      priceAdjustment: priceAdjustment,
      attachedMedicalCoverages: attachedMedicalCoverages,
      excludedCoveragePlanIds: excludedCoveragePlanIds
    });

    if (this.issuedMedicalTest) {
      this.issuedMedicalTest.push(newIssuedMedicalTestDetails);
    } else {
      this.issuedMedicalTest = new FormArray([newIssuedMedicalTestDetails]);
    }
  }

  addMultipleIssuedMedicalTestDetails(count: number) {
    for (let index = 0; index < count; index++) {
      this.initIssuedMedicalTestDetails();
    }

    return this.issuedMedicalTest;
  }

  // PATIENT REFERRAL //

  initPatientReferral() {
    const practice = new FormControl();
    const clinicId = new FormControl();
    const doctorId = new FormControl();
    const appointmentDateTime = new FormControl();
    const memo = new FormControl();
    const str = new FormControl();
    const externalReferral = new FormControl();
    const externalReferralDetails = this.fb.group({
      doctorName: '',
      address: '',
      phoneNumber: ''
    });

    externalReferral.patchValue(false);

    this.addPatientReferral(
      practice,
      clinicId,
      doctorId,
      appointmentDateTime,
      memo,
      str,
      externalReferral,
      externalReferralDetails
    );

    return this.patientReferral;
  }

  addPatientReferral(
    practice: FormControl,
    clinicId: FormControl,
    doctorId: FormControl,
    appointmentDateTime: FormControl,
    memo: FormControl,
    str: FormControl,
    externalReferral: FormControl,
    externalReferralDetails: FormGroup
  ) {
    const newPatientReferral = new FormGroup({
      practice: practice,
      clinicId: clinicId,
      doctorId: doctorId,
      appointmentDateTime: appointmentDateTime,
      memo: memo,
      str: str,
      externalReferral: externalReferral,
      externalReferralDetails: externalReferralDetails
    });

    if (this.patientReferral) {
      this.patientReferral.push(newPatientReferral);
    } else {
      this.patientReferral = new FormArray([newPatientReferral]);
    }
  }

  // PATIENT REFERRAL //

  // DIAGNOSIS
  initDiagnosis() {
    const id = new FormControl('');
    this.addDiagnosis(id);

    return this.diagnosis;
  }

  addDiagnosis(id: FormControl) {
    const newDiagnosisItem = new FormGroup({
      id: id
    });

    if (this.diagnosis) {
      this.diagnosis.push(newDiagnosisItem);
    } else {
      this.diagnosis = new FormArray([newDiagnosisItem], this.emptyFormArrayValidator('id'));
    }
  }

  removeDiagnosis(index) {
    this.diagnosis.removeAt(index);
  }

  doubleInitDiagnosis() {
    this.initDiagnosis();
    this.initDiagnosis();
    return this.diagnosis;
  }
  // DIAGNOSIS

  // FOLLOW UP
  initFollowup() {
    return this.fb.group({ followupDate: '', remarks: '' });
  }

  setFollowup(followupDate?: string, remarks?: string) {
    if (this.followupConsultation) {
      this.followupConsultation.patchValue({ followupDate: followupDate || '', remarks: remarks || '' });
    } else {
      this.followupConsultation = this.fb.group({ followupDate: followupDate || '', remarks: remarks || '' });
    }
    return this.followupConsultation;
  }
  // FOLLOW UP

  // VITAL FORM
  generateVitalForm(): FormGroup {
    const formGroup = new FormGroup(
      {
        weight: new FormControl(''),
        height: new FormControl(''),
        bmi: new FormControl(''),
        bp: this.fb.group(
          {
            systolic: new FormControl(''),
            diastolic: new FormControl('')
          },
          AtLeastOneFieldValidator
        ),
        pulse: new FormControl(''),
        respiration: new FormControl(''),
        temperature: new FormControl(''),
        sa02: new FormControl(''),
        others: new FormControl('')
      },
      AtLeastOneFieldValidator
    );

    // formGroup.setValidators(AtLeastOneFieldValidator);
    return formGroup;
  }
  // VITAL FORM

  // Validation for Diagnosis
  // Only works for FormArray with FormControl as direct child
  emptyFormArrayValidator(validationKey: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const controlArray = <FormArray>control;
      const controlArrayValue = controlArray.value;
      let isValid = false;

      // loop through the Array
      controlArrayValue.forEach((value, key) => {
        // loop through the content of the Array which could be object
        for (const innerKey of Object.keys(value)) {
          if (innerKey === validationKey) {
            if (value[innerKey] && value[innerKey].length > 0) {
              isValid = true;
              return;
            }
          }
        }
      });
      return isValid ? null : { formArrayRequired: { value: control.value } };
    };
  }
}

export function mulitplierValidator(multiplier: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    return (control.value * 1000) % (multiplier * 1000) != 0
      ? { multiplierError: { multiplier: multiplier } }
      : null;
  };
}
