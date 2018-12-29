import {
  MedicalCoverageResponse,
  Insurance,
  PolicyHolder,
  CoveragePlan,
  Contact
} from './../objects/response/MedicalCoverageResponse';
import { FormGroup, FormArray, FormBuilder, FormControl } from '@angular/forms';
import { Injectable } from '@angular/core';

@Injectable()
export class MedicalCoverageFormService {
  policyHolder: FormGroup;
  coveragePlan: FormGroup;
  contacts: FormArray;

  constructor(private fb: FormBuilder) { }

  populateForm(medicalCoverage: Insurance) {
    const { policyHolder, coveragePlan, contacts } = medicalCoverage;
    return this.fb.group({
      policyHolder: this.createPolicyHolder(policyHolder),
      coveragePlan: this.createCoveragePlan(coveragePlan),
      contacts: this.createContacts(contacts)
    });
  }

  createPolicyHolder(policyHolder?: PolicyHolder) {
    if (!policyHolder) {
      policyHolder = new PolicyHolder();
    }

    return this.fb.group({
      id: policyHolder.id,
      identificationNumber: this.fb.group({
        idType: policyHolder.identificationNumber.idType,
        number: policyHolder.identificationNumber.number
      }),
      name: policyHolder.name,
      medicalCoverageId: policyHolder.medicalCoverageId,
      planId: policyHolder.planId,
      patientCoverageId: policyHolder.patientCoverageId,
      specialRemarks: policyHolder.specialRemarks,
      status: policyHolder.status,
      startDate: policyHolder.startDate,
      endDate: policyHolder.endDate,
      costCenter: policyHolder.costCenter
    });
  }

  createCoveragePlan(coveragePlan?: CoveragePlan) {
    if (!coveragePlan) {
      coveragePlan = new CoveragePlan();
    }
    console.log('coverage Plan', coveragePlan);
    const { capPerVisit, capPerWeek, capPerMonth, capPerYear, capPerLifeTime, copayment } = coveragePlan;

    return this.fb.group({
      id: coveragePlan.id,
      name: coveragePlan.name,
      capPerVisit: this.fb.group({ visits: capPerVisit.visits, limit: capPerVisit.limit }),
      capPerWeek: this.fb.group({ visits: capPerWeek.visits, limit: capPerWeek.limit }),
      capPerMonth: this.fb.group({ visits: capPerMonth.visits, limit: capPerMonth.limit }),
      capPerYear: this.fb.group({ visits: capPerYear.visits, limit: capPerYear.limit }),
      capPerLifeTime: this.fb.group({ visits: capPerLifeTime.visits, limit: capPerLifeTime.limit }),
      copayment: this.fb.group({ value: copayment.value, paymentType: copayment.paymentType }),
      limitResetType: coveragePlan.limitResetType,
      code: coveragePlan.code,
      remarks: coveragePlan.remarks,
      clinicRemarks: coveragePlan.clinicRemarks,
      registrationRemarks: coveragePlan.registrationRemarks,
      paymentRemarks: coveragePlan.paymentRemarks,
      //   excludedClinics: coveragePlan.excludedClinics,
      excludeAllByDefault: coveragePlan.excludeAllByDefault,
      includedMedicalServiceSchemes: coveragePlan.includedMedicalServiceSchemes,
      excludedMedicalServiceSchemes: coveragePlan.excludedMedicalServiceSchemes
      //allowedRelationship: coveragePlan.allowedRelationship
    });
  }

  createCoverageSelectedFB(policyHolder): FormGroup {

    const p = policyHolder;
    const formGroup = this.fb.group({
      costCenter: p.costCenter,
      id: p.id,
      identificationNumber: this.fb.group({
        idType: p.identificationNumber.idType,
        number: p.identificationNumber.number
      }),
      medicalCoverageId: p.medicalCoverageId,
      name: p.name,
      patientCoverageId: p.patientCoverageId,
      planId: p.planId,
      specialRemarks: p.specialRemarks,
      startDate: p.startDate,
      status: p.status,
      endDate: p.endDate
    });

    return formGroup;
  }

  createContacts(contacts?: Array<Contact>) {
    const tempFormArray = this.fb.array([]);

    if (!contacts) {
      console.log('init contacts');
      contacts = new Array<Contact>();
      contacts.push(new Contact());
    }

    console.log('contacts', contacts);

    contacts.forEach(element => {
      const tempFormGroup = this.fb.group({
        name: element.name,
        title: element.title,
        directNumber: element.directNumber,
        faxNumber: element.faxNumber,
        email: element.email
      });

      tempFormArray.push(tempFormGroup);
    });
    return tempFormArray;
  }
}
