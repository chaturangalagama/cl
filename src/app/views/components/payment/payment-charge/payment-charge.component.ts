import { Clinic } from './../../../../objects/response/Clinic';
import { Component, OnInit, HostListener, ViewChild, Testability } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormArray,
} from '@angular/forms';
import { Router, NavigationStart } from '@angular/router';

import { forkJoin } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';

import * as moment from 'moment';

import { StoreService } from '../../../../services/store.service';
import { AlertService } from '../../../../services/alert.service';
import { ApiCmsManagementService } from '../../../../services/api-cms-management.service';
import { ApiPatientInfoService } from '../../../../services/api-patient-info.service';
import { ApiPatientVisitService } from '../../../../services/api-patient-visit.service';
import { PaymentService } from '../../../../services/payment.service';
import { DISPLAY_DATE_FORMAT, DB_FULL_DATE_FORMAT, DB_FULL_DATE_TIMEZONE } from '../../../../constants/app.constants';
import { UtilsService } from '../../../../services/utils.service';
import { PaymentMedicalServiceComponent } from '../../../../components/payment/payment-medical-service/payment-medical-service.component';
import { Subscription } from '../../../../../../node_modules/rxjs';
import { PaymentPrescriptionComponent } from '../../../../components/payment/payment-prescription/payment-prescription.component';
import { PaymentMedicalTestComponent } from '../../../../components/payment/payment-medical-test/payment-medical-test.component';
import { PaymentImmunizationComponent } from '../../../../components/payment/payment-immunization/payment-immunization.component';
import { AppConfigService } from '../../../../services/app-config.service';
import { TempStoreService } from '../../../../services/temp-store.service';

@Component({
  selector: 'app-payment-charge',
  templateUrl: './payment-charge.component.html',
  styleUrls: ['./payment-charge.component.scss']
})
export class PaymentChargeComponent implements OnInit {
  @ViewChild(PaymentMedicalServiceComponent) medicalServiceComponent: PaymentMedicalServiceComponent;
  @ViewChild(PaymentPrescriptionComponent) prescriptionComponent: PaymentPrescriptionComponent;
  @ViewChild(PaymentMedicalTestComponent) medicalTestComponent: PaymentMedicalTestComponent;
  @ViewChild(PaymentImmunizationComponent) immunizationComponent: PaymentImmunizationComponent;

  postConsultTempStoreKey = this.store.getPatientVisitRegistryId()
    ? 'POST_CONSULT_' + this.store.getPatientVisitRegistryId()
    : '';

  subscriptions = [];
  userIdSet = new Set<string>();

  chargeFormGroup: FormGroup;
  patientInfo;
  consultationInfo;
  chargeItemArray;
  priceChecks;
  visitCoverageArray;

  error: string;
  drugErrors = [];
  isSave = false;
  navigatingUrl: string;
  isMedicalCoverageChanged = false;

  patientCoverages = [];

  removeTempStoreUserName = false;

  private API_CMS_MANAGEMENT_URL;
  access_token: string;

  constructor(
    private router: Router,
    private store: StoreService,
    private alertService: AlertService,
    private utils: UtilsService,
    private tempStore: TempStoreService,
    private appConfig: AppConfigService,
    private apiCmsManagementService: ApiCmsManagementService,
    private apiPatientInfoService: ApiPatientInfoService,
    private apiPatientVisitService: ApiPatientVisitService,
    private paymentService: PaymentService,
    private fb: FormBuilder
  ) {
    this.API_CMS_MANAGEMENT_URL = appConfig.getConfig().API_CMS_MANAGEMENT_URL;
  }

  ngOnInit() {
    if (!this.store.getPatientId()) {
      alert('No Patient Details');
      this.router.navigate(['pages/patient/list']);
      return;
    }

    this.userIdSet.clear();
    this.paymentService.resetVisitCoverageArray();
    this.visitCoverageArray = this.paymentService.visitCoverageArray;

    const consultationSubscription = this.paymentService.getConsultationInfoObservable().subscribe(consultationInfo => {
      this.consultationInfo = consultationInfo;
    });
    this.subscriptions.push(consultationSubscription);

    this.subscribeSubComponentsUpateOverallPrice();

    this.chargeFormGroup = this.paymentService.getChargeFormGroup();
    this.apiPatientInfoService.searchBy('systemuserid', this.store.getPatientId()).subscribe(
      res => {
        const patientInfo = (this.patientInfo = res.payload);
        this.chargeFormGroup.get('patientInfoFormGroup').patchValue({
          patientNo: patientInfo.patientNumber,
          patientName: patientInfo.name,
          age: moment().diff(moment(patientInfo.dob, DISPLAY_DATE_FORMAT), 'years'),
          sex: patientInfo.gender,
          dateOfBirth: patientInfo.dob,
          NRIC: patientInfo.userId.number,
          occupation: patientInfo.company ? patientInfo.company.occupation : '-',
          // address: `${patientInfo.address.address}, ${patientInfo.address.country} ${patientInfo.address.postalCode}`, //todo need to add back the country after handling it registration
          address: `${patientInfo.address.address}, ${patientInfo.address.postalCode}`
        });
      },
      err => this.alertService.error(JSON.stringify(err.error.message))
    );

    this.checkConcurrentTempStore();

    if (this.chargeFormGroup.value.needRefresh) {
      this.apiPatientVisitService.consultationSearchByPatientRegistry(this.store.getPatientVisitRegistryId()).subscribe(
        res => {
          this.paymentService.setConsultationInfo(res.payload);
          console.log('consultation info: ', this.consultationInfo);
          this.initConsultationInfo();

          // === Retrive AttachedMedicalCoverage for this Patient ===
          this.apiPatientVisitService.patientVisitSearch(this.store.getPatientVisitRegistryId()).subscribe(
            res => {
              const attachedMedicalCoverage = res.payload.patientVisitRegistry.attachedMedicalCoverages;
              const coverageLimitFormGroup = this.chargeFormGroup.get('coverageLimitFormGroup');
              const coverageLimitArray = coverageLimitFormGroup.get('coverageLimitArray') as FormArray;

              if (!this.consultationInfo.planMaxUsages) {
                this.consultationInfo.planMaxUsages = {};
              }

              const observableBatch = [];
              attachedMedicalCoverage.forEach(ele => {
                observableBatch.push(this.apiCmsManagementService.searchCoverage(ele.medicalCoverageId));
              });

              if (observableBatch.length === 0) {
                // === Do forkJoin for paymentCheck if no medical coverage is attached ===
                this.startPaymentCheck();
              }

              forkJoin(observableBatch).subscribe(
                coverageArr => {
                  // Merge array of payload into one array
                  coverageArr.forEach(e => {
                    const arrayE = e['payload'] as any[];
                    arrayE.forEach(f => {
                      this.patientCoverages.push(f);
                    });
                  });
                  // Option for Cash
                  // this.visitCoverageArray.push({ 'name': 'CASH', 'type': 'CASH', 'planDetail': { id: 0 } }); //Remove option for Cash
                  attachedMedicalCoverage.forEach(element => {
                    const coverage = this.patientCoverages.find(val => val.id === element.medicalCoverageId);
                    const plan = coverage.coveragePlans.find(val => val.id === element.planId);
                    this.visitCoverageArray.push({
                      name: `${coverage.name}\n${plan.name}`,
                      type: coverage.type,
                      planDetail: plan
                    });

                    const initialLimit = plan.capPerVisit.limit || 0;
                    this.consultationInfo.planMaxUsages[plan.id] = initialLimit;

                    const coverageLimitItem = this.fb.group({
                      name: `${coverage.name}\n${plan.name}`,
                      planId: plan.id,
                      type: coverage.type,
                      initialLimit: { value: initialLimit, disabled: true },
                      updatedLimit: initialLimit,
                      disabled: coverage.type === 'CORPORATE' ? true : false
                    });
                    coverageLimitArray.push(coverageLimitItem);

                    coverageLimitItem.valueChanges.subscribe(values => {
                      this.consultationInfo.planMaxUsages[values.planId] = values.updatedLimit;
                      this.updateOverallPrice();
                    });
                  });

                  // === Do forkJoin for paymentCheck after retriving attachedMedicalCoverage ===
                  this.startPaymentCheck();
                },
                err => this.alertService.error(JSON.stringify(err.error.message))
              );
            },
            err => this.alertService.error(JSON.stringify(err.error.message))
          );
        },
        err => this.alertService.error(JSON.stringify(err.error.message))
      );
    }
  }

  startPaymentCheck() {
    forkJoin(
      this.apiPatientVisitService.paymentCheckMedicalService(
        this.store.getPatientVisitRegistryId(),
        this.consultationInfo.medicalServiceGiven.medicalServices.map(medicalService => ({
          itemId: medicalService.serviceItemId,
          excludedCoveragePlanIds: medicalService.excludedCoveragePlanIds
        }))
      ),
      this.apiPatientVisitService.paymentCheckDrug(
        this.store.getPatientVisitRegistryId(),
        this.consultationInfo.drugDispatch.dispatchDrugDetail.map(drug => ({
          itemId: drug.drugId,
          excludedCoveragePlanIds: drug.excludedCoveragePlanIds
        }))
      ),
      this.apiPatientVisitService.paymentCheckVaccination(
        this.store.getPatientVisitRegistryId(),
        this.consultationInfo.immunisationGiven.immunisation.map(vaccination => ({
          itemId: vaccination.doseId,
          excludedCoveragePlanIds: vaccination.excludedCoveragePlanIds
        }))
      ),
      this.apiPatientVisitService.paymentCheckMedicalTest(
        this.store.getPatientVisitRegistryId(),
        this.consultationInfo.issuedMedicalTest.issuedMedicalTestDetails.map(medicalTest => ({
          itemId: medicalTest.testId,
          excludedCoveragePlanIds: medicalTest.excludedCoveragePlanIds
        }))
      )
    ).subscribe(
      arr => {
        arr.map(res => res.payload);
        this.priceChecks = arr.map(res => res.payload);

        this.updateFormGroup();

        this.subscribeValueChanges();

        this.isSave = false;
        const routerSubscription = this.router.events.subscribe(event => {
          if (event instanceof NavigationStart) {
            this.navigatingUrl = event.url;
            if (event.url === '/pages/payment/collect' && !this.isSave) {
              console.log(this.consultationInfo);
              this.paymentService.setConsultationInfo(this.consultationInfo);

              this.consultationInfo.executeOnlyTest = true;
              this.apiPatientVisitService
                .payment(this.store.getPatientVisitRegistryId(), this.consultationInfo)
                .subscribe(
                  res => {
                    this.isSave = true;
                    this.router.navigate([event.url]);
                  },
                  err => this.alertService.error(JSON.stringify(err.error.message))
                );
            }
          }
        });
        this.subscriptions.push(routerSubscription);
      },
      err => this.alertService.error(JSON.stringify(err.error.message))
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      (subscription as Subscription).unsubscribe();
    });

    this.userIdSet.clear();
    this.tempStore.tempStoreRetrieve(this.postConsultTempStoreKey).subscribe(
      res => {
        if (res.payload || { value: '' }.value) {
          const list: Array<string> = JSON.parse(res.payload.value);
          list.map(item => this.userIdSet.add(item));
        }

        this.userIdSet.add(this.store.getUser().userName);

        this.removeConcurrentRecord();
      },
      err => this.alertService.error(JSON.stringify(err.error.message))
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler($event: any) {
    this.removeConcurrentRecordSync();
    return false;
  }

  // Action
  onBtnSaveClicked() {
    this.paymentService.setConsultationInfo(this.consultationInfo);
    this.consultationInfo.executeOnlyTest = true;
    this.apiPatientVisitService.payment(this.store.getPatientVisitRegistryId(), this.consultationInfo).subscribe(
      res => {
        this.router.navigate(['pages/payment/collect']);
      },
      err => this.alertService.error(JSON.stringify(err.error.message))
    );
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.code === '0x003E' && this.chargeFormGroup.valid) {
      this.onBtnSaveClicked();
    }
  }

  // Main
  updateFormGroup() {
    const medicalServiceArray = this.chargeFormGroup
      .get('medicalServiceFormGroup')
      .get('medicalServiceArray') as FormArray;
    const diagnosisArray = this.chargeFormGroup.get('diagnosisFormGroup').get('diagnosisArray') as FormArray;
    const prescriptionFormGroup = this.chargeFormGroup.get('prescriptionFormGroup');
    const drugArray = prescriptionFormGroup.get('drugArray') as FormArray;
    const medicalTestArray = this.chargeFormGroup.get('medicalTestFormGroup').get('medicalTestArray') as FormArray;
    const immunizationArray = this.chargeFormGroup.get('immunizationFormGroup').get('immunizationArray') as FormArray;
    const followUpFormGroup = this.chargeFormGroup.get('prescriptionFormGroup').get('followUpFormGroup');
    const printFormGroup = this.chargeFormGroup.get('printFormGroup');
    const medicalCertificateArray = printFormGroup.get('medicalCertificateArray') as FormArray;
    const referralArray = this.chargeFormGroup.get('referralFormGroup').get('referralFormArray') as FormArray;
    const printReferralArray = printFormGroup.get('referralArray') as FormArray;
    const chargeItemArray = (this.chargeItemArray = [
      medicalServiceArray,
      drugArray,
      medicalTestArray,
      immunizationArray
    ]);
    const [medicalServicePrices, drugPrices, vaccinationPrices, medicalTestPrices] = this.priceChecks;

    if (this.consultationInfo.clinicNotes) {
      this.chargeFormGroup.get('clinicNoteFormGroup').patchValue({
        clinicNotes: this.consultationInfo.clinicNotes
      });
    }

    this.consultationInfo.medicalServiceGiven.medicalServices.forEach(medicalService => {
      const priceInfo = medicalServicePrices.find(val => val.itemId === medicalService.serviceItemId);
      if (priceInfo) {
        medicalServiceArray.push(
          this.medicalServiceComponent.formatMedicalServicesToFormGroup(medicalService, priceInfo)
        );
      }
    });
    medicalServiceArray.push(this.medicalServiceComponent.newMedicalServiceArrayItem());

    this.apiCmsManagementService.searchDiagnosisByIds(this.consultationInfo.diagnosisIds).subscribe(
      res => {
        const diagnosis = res.payload;
        diagnosis.forEach(diagnosisItem => {
          diagnosisArray.push(
            this.fb.group({
              icds: {
                value: diagnosis.map(obj => {
                  return { value: obj.icd10Code, label: `${obj.icd10Code} (${obj.icd10Term})` };
                })
              },
              icd: { value: diagnosisItem.icd10Code, disabled: true },
              description: { value: diagnosisItem.icd10Term, disabled: true }
            })
          );
        });
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );

    const drugUsages = [];
    this.consultationInfo.drugDispatch.dispatchDrugDetail.forEach(detail => {
      const drugUsage = {
        inventoryType: 'DRUG',
        itemId: detail.drugId,
        quantity: detail.quantity
      };
      drugUsages.push(drugUsage);
    });
    if (drugUsages.length === 0) {
      drugArray.push(this.prescriptionComponent.newDrugArrayItem());
    } else {
      this.consultationInfo.drugDispatch.dispatchDrugDetail.forEach((drug, index) => {
        const detail = this.store.getDrugList().find(item => item.id === drug.drugId);
        const priceInfo = drugPrices.find(val => val.itemId === drug.drugId);
        if (priceInfo) {
          if (index === 0) {
            prescriptionFormGroup.patchValue({
              charge: `${drug.name} / ${drug.dose.quantity} ${drug.dose.uom}(s)`,
              sig: `${drug.instruction.instruct || ''}`,
              dosageInstruction: (drug.dosageInstruction.instruct || '').replace('#', drug.dose.quantity),
              cautionary: `${(detail.cautionary || []).join('\n') || ''}`,
              remarks: drug.remark
            });
          }
          const drugItem = this.prescriptionComponent.formatDrugToFormGroup(drug, priceInfo, {
            batchNo: drug.batchNumber || '',
            remainingQuantity: 9999,
            expiryDate: drug.expiryDate || '' //moment(new Date()).format(DISPLAY_DATE_FORMAT)
          });
          drugArray.push(drugItem);
          this.apiPatientInfoService
            .checkAllergies(this.store.getPatientId(), [drugItem.get('drugCode').value])
            .subscribe(
              res => {
                if (res.payload.includes(drugItem.get('drugCode').value)) {
                  drugItem.get('isAllergic').patchValue(true, { emitEvent: false });
                } else {
                  this.drugErrors = [];
                }
              },
              err => this.alertService.error(JSON.stringify(err.error.message))
            );

          // Retrive Inventory information again if no Batch number exist
          const drugUsage = { inventoryType: 'DRUG', itemId: drug.drugId, quantity: drug.quantity };
          this.apiPatientVisitService.getInventory(this.store.getClinicId(), [drugUsage]).subscribe(
            res => {
              const inventories = res.payload;
              const inventory = inventories.find(iv => iv.itemId === drug.drugId);

              const batchNo = inventory.batchNo ? inventory.batchNo : '';
              const stock = inventory.remainingQuantity ? inventory.remainingQuantity : 9999;
              const isDateValid = moment(inventory.expiryDate, DISPLAY_DATE_FORMAT).isValid();
              const expiryDate = isDateValid
                ? moment(inventory.expiryDate, 'YYYY-MM-DD').format(DISPLAY_DATE_FORMAT)
                : moment(new Date()).format(DISPLAY_DATE_FORMAT);

              // Inventory Invalid msg will be shown if any field is mising
              const inventoryInvalid = batchNo && expiryDate && stock ? false : true;
              drugItem.patchValue(
                {
                  batchNo: batchNo,
                  expiryDate: expiryDate,
                  stock,
                  inventoryInvalid,
                  inventoryNotFound: false
                },
                { emitEvent: false }
              );
              this.prescriptionComponent.setInventoryValidator(drugItem);
            },
            err => {
              drugItem.patchValue(
                {
                  batchNo: '',
                  expiryDate: '',
                  // expiryDate: moment(new Date()).format(DISPLAY_DATE_FORMAT),
                  stock: 9999,
                  inventoryInvalid: false,
                  inventoryNotFound: true
                },
                { emitEvent: false }
              );
              this.prescriptionComponent.setInventoryValidator(drugItem);
            }
          );
        }
      });
      drugArray.push(this.prescriptionComponent.newDrugArrayItem());
    }

    this.consultationInfo.issuedMedicalTest.issuedMedicalTestDetails.forEach(medicalTest => {
      const priceInfo = medicalTestPrices.find(val => val.itemId === medicalTest.testId);
      if (priceInfo) {
        medicalTestArray.push(this.medicalTestComponent.formatMedicalTestsToFormGroup(medicalTest, priceInfo));
      }
    });

    this.consultationInfo.immunisationGiven.immunisation.forEach(vaccination => {
      const priceInfo = vaccinationPrices.find(val => val.itemId === vaccination.doseId);
      if (priceInfo) {
        const item = this.immunizationComponent.formatImmunizationToFormGroup(vaccination, priceInfo);
        immunizationArray.push(item);
        this.immunizationComponent.subscribeImmunizationArrayItemValueChanges(item, item.value);
      }
    });

    this.updateOverallPrice();

    this.consultationInfo.medicalCertificates.forEach(medicalCertificate => {
      const { purpose, startDate, numberOfDays, referenceNumber, halfDayOption, remark } = medicalCertificate;
      const adjustedEndDate = numberOfDays - 1 >= 0 ? numberOfDays - 1 : 0;
      console.log('ADJUSTED END DATE: ', adjustedEndDate);
      const endDate = moment(medicalCertificate.startDate, DISPLAY_DATE_FORMAT)
        .add(adjustedEndDate, 'days')
        .format(DISPLAY_DATE_FORMAT);
      medicalCertificateArray.push(
        this.fb.group({
          purpose,
          startDate,
          endDate,
          numberOfDays,
          referenceNumber,
          halfDayOption,
          medicalCertificateStr: `${purpose} for ${numberOfDays} day(s) from ${startDate} to ${endDate}`,
          remark
        })
      );
    });

    if (this.consultationInfo.patientReferral) {
      let doctor;
      let clinic = new Clinic();
      let str = '';

      const patientReferrals = this.consultationInfo.patientReferral.patientReferrals;
      patientReferrals.map(
        element => {
          element.appointmentDateTime = element.appointmentDateTime ? element.appointmentDateTime : '';
          element.clinicId = element.clinicId ? element.clinicId : '';
          element.doctorId = element.doctorId ? element.doctorId : '';
          element.externalReferral = element.externalReferral ? element.externalReferral : false;
          element.memo = element.memo ? element.memo.replace(/<p>&nbsp;<\/p>/g, '') : '';
          element.memo = element.memo ? element.memo.replace(/↵/, '') : '';
          element.practice = element.practice ? element.practice : '';

          element.externalReferralDetails = element.externalReferralDetails
            ? element.externalReferralDetails
            : { address: '', doctorName: '', phoneNumber: '' };

          doctor = this.store.getDoctorList().find(doctor => doctor.id === element.doctorId);
          clinic = this.store.getClinicList().find(clinic => clinic.id === element.clinicId);

          const appointmentDateTime = element.appointmentDateTime ? element.appointmentDateTime : '';
          const clinicId = element.clinicId ? element.clinicId : '';
          const doctorId = element.doctorId ? element.doctorId : '';
          const externalReferral = element.externalReferral ? element.externalReferral : '';
          const memo = element.memo ? element.memo : '';
          const practice = element.practice ? element.practice : '';

          const address = element.externalReferralDetails.address ? element.externalReferralDetails.address : '';
          const doctorName = element.externalReferralDetails.doctorName
            ? element.externalReferralDetails.doctorName
            : '';
          const phoneNumber = element.externalReferralDetails.phoneNumber
            ? element.externalReferralDetails.phoneNumber
            : '';

          const externalReferralDetails = this.fb.group({
            address: address,
            doctorName: doctorName,
            phoneNumber: phoneNumber
          });

          element.externalReferralDetails = element.externalReferralDetails
            ? element.externalReferralDetails
            : externalReferralDetails;

          if (!element.externalReferral) {
            str = element.memo
              ? `Referral letter to ${doctor.name} (${clinic.name}@${clinic.address.address || ''} Singapore ${
                  clinic.address.postalCode
                })`
              : '';
            element.str = str;
          } else {
            str = element.memo
              ? `Referral letter to ${element.externalReferralDetails.doctorName} (${
                  element.externalReferralDetails.address
                })`
              : '';
            element.str = str;
          }

          const referralObj = this.fb.group({
            appointmentDateTime: appointmentDateTime,
            clinicId: clinicId,
            doctorId: doctorId,
            externalReferral: externalReferral,
            memo: memo,
            practice: practice,
            externalReferralDetails: externalReferralDetails,
            str
          });

          referralArray.push(referralObj);
          printReferralArray.push(this.fb.group(element));
        }
      );
    }

    if (this.consultationInfo.memo) {
      let tempMemo: string = this.consultationInfo.memo;
      // tempMemo = tempMemo.replace("<p>&nbsp;</p>", "");
      // tempMemo = tempMemo.replace("<p>", "");
      tempMemo = tempMemo.replace(/<p>&nbsp;<\/p>/g, '');
      printFormGroup.patchValue({
        memo: tempMemo
      });
    }

    if (!this.consultationInfo.visitTimeChit) {
      this.consultationInfo.visitTimeChit = {};
      this.consultationInfo.visitTimeChit.from = this.consultationInfo.consultationStartTime;

      printFormGroup.patchValue({
        timeChitFrom: moment(this.consultationInfo.consultationStartTime, 'DD-MM-YYYYTHH:mm:ss').format(
          DB_FULL_DATE_TIMEZONE
        )
        // timeChitTo: moment(this.consultationInfo.consultationEndTime, 'DD-MM-YYYYTHH:mm:ss').format(
        //   DB_FULL_DATE_TIMEZONE
        // )
      });
    }

    if (!this.consultationInfo.visitTimeChit.to) {
      this.consultationInfo.visitTimeChit.to = moment(printFormGroup.value.timeChitTo).format(DB_FULL_DATE_FORMAT);
    }

    if (this.consultationInfo.followupConsultation) {
      followUpFormGroup.patchValue({
        followupDate: this.consultationInfo.followupConsultation.followupDate,
        remarks: this.consultationInfo.followupConsultation.remarks
      });
    }

    this.chargeFormGroup.patchValue({ needRefresh: false });
    this.paymentService.setChargeFormGroup(this.chargeFormGroup);
  }

  subscribeValueChanges() {
    const followUpFormGroup = this.chargeFormGroup.get('prescriptionFormGroup').get('followUpFormGroup');
    const medicalServiceFormGroup = this.chargeFormGroup.get('medicalServiceFormGroup');
    const medicalServiceArray = medicalServiceFormGroup.get('medicalServiceArray') as FormArray;
    const prescriptionFormGroup = this.chargeFormGroup.get('prescriptionFormGroup');
    const drugArray = prescriptionFormGroup.get('drugArray') as FormArray;
    const medicalTestFormGroup = this.chargeFormGroup.get('medicalTestFormGroup');
    const medicalTestArray = medicalTestFormGroup.get('medicalTestArray') as FormArray;
    const immunizationFormGroup = this.chargeFormGroup.get('immunizationFormGroup');
    const immunizationArray = immunizationFormGroup.get('immunizationArray') as FormArray;
    const printFormGroup = this.chargeFormGroup.get('printFormGroup');
    const referralFormGroup = this.chargeFormGroup.get('referralFormGroup');
    const printReferralArray = this.chargeFormGroup.get('printFormGroup').get('referralArray') as FormArray;

    followUpFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        this.consultationInfo.followupConsultation = {};
        this.consultationInfo.followupConsultation.followupDate = moment(values.followupDate).format(
          DISPLAY_DATE_FORMAT
        );
        this.consultationInfo.followupConsultation.remarks = values.remarks;
        this.paymentService.setConsultationInfo(this.consultationInfo);
      });

    medicalServiceFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        if (values.isAdd) {
          medicalServiceFormGroup.patchValue({
            isAdd: false
          });
          medicalServiceArray.push(this.medicalServiceComponent.newMedicalServiceArrayItem());
        }
      });

    prescriptionFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        if (values.isAdd) {
          prescriptionFormGroup.patchValue({
            isAdd: false
          });
          drugArray.push(this.prescriptionComponent.newDrugArrayItem());
        }
      });

    medicalTestFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        if (values.isAdd) {
          medicalTestFormGroup.patchValue({
            isAdd: false
          });
          medicalTestArray.push(this.medicalTestComponent.newMedicalTestArrayItem());
        }
      });

    immunizationFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        if (values.isAdd) {
          immunizationFormGroup.patchValue({
            isAdd: false
          });
          immunizationArray.push(this.immunizationComponent.newImmunizationArrayItem());
        }
      });

    printFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        console.log('print form group : ', values.timeChitFrom);
        console.log('consultaiton start time: ', this.consultationInfo.consultationStartTime);
        this.consultationInfo.visitTimeChit = {};
        this.consultationInfo.visitTimeChit.from = moment(values.timeChitFrom).format(DB_FULL_DATE_FORMAT);
        this.consultationInfo.visitTimeChit.to = moment(values.timeChitTo).format(DB_FULL_DATE_FORMAT);
        this.consultationInfo.patientReferral.patientReferrals = values.referralArray;
        this.paymentService.setConsultationInfo(this.consultationInfo);
      });

    referralFormGroup.valueChanges
      .pipe(debounceTime(50), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(values => {
        values.referralFormArray.map(referral => {
          let str = '';
          if (!referral.externalReferral) {
            if (referral.doctorId && referral.clinicId) {
              const doctor = this.store.getDoctorList().find(doctor => doctor.id === referral.doctorId);
              const clinic = this.store.getClinicList().find(clinic => clinic.id === referral.clinicId);
              str = referral.memo
                ? `Referral letter to ${doctor.name} (${clinic.name}@${clinic.address.address || ''} Singapore ${
                    clinic.address.postalCode
                  })`
                : '';
              referral.str = str;
            }
          } else {
            str = referral.memo
              ? `Referral letter to ${referral.externalReferralDetails.doctorName} (${
                  referral.externalReferralDetails.address
                })`
              : '';
            referral.str = str;
          }
        });
        this.consultationInfo.patientReferral.patientReferrals = values.referralFormArray;
        // printReferralArray.patchValue(values.referralFormArray);
      });
  }

  subscribeSubComponentsUpateOverallPrice() {
    const updateMedicalServicePriceSubscription = this.medicalServiceComponent.updatePrice.subscribe(value => {
      this.updateOverallPrice();
    });
    this.subscriptions.push(updateMedicalServicePriceSubscription);

    const updatePrescriptionPriceSubscription = this.prescriptionComponent.updatePrice.subscribe(value => {
      this.updateOverallPrice();
    });
    this.subscriptions.push(updatePrescriptionPriceSubscription);

    const updateMedicatlTestPriceSubscription = this.medicalTestComponent.updatePrice.subscribe(value => {
      this.updateOverallPrice();
    });
    this.subscriptions.push(updateMedicatlTestPriceSubscription);

    const updateImmunizationPriceSubscription = this.immunizationComponent.updatePrice.subscribe(value => {
      this.updateOverallPrice();
    });
    this.subscriptions.push(updateImmunizationPriceSubscription);
  }

  // Utils
  initConsultationInfo() {
    if (!this.consultationInfo.medicalServiceGiven) {
      this.consultationInfo.medicalServiceGiven = {};
      this.consultationInfo.medicalServiceGiven.medicalServices = [];
    }
    if (!this.consultationInfo.drugDispatch) {
      this.consultationInfo.drugDispatch = {};
      this.consultationInfo.drugDispatch.dispatchDrugDetail = [];
    }
    if (!this.consultationInfo.immunisationGiven) {
      this.consultationInfo.immunisationGiven = {};
      this.consultationInfo.immunisationGiven.immunisation = [];
    }
    if (!this.consultationInfo.issuedMedicalTest) {
      this.consultationInfo.issuedMedicalTest = {};
      this.consultationInfo.issuedMedicalTest.issuedMedicalTestDetails = [];
    }
    if (!this.consultationInfo.followupConsultation) {
      this.consultationInfo.followupConsultation = {};
    }

    if (!this.consultationInfo.patientReferral) {
      this.consultationInfo.patientReferral = {};
      this.consultationInfo.patientReferral.patientReferrals = [];
    }

    if (this.consultationInfo.memo) {
      let tempMemo: string = this.consultationInfo.memo;
      tempMemo = tempMemo.replace(/<p>&nbsp;<\/p>/g, '');
      this.consultationInfo.memo = tempMemo;
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.keyCode === 115) {
      console.log('F4');
      if (this.consultationInfo && this.chargeFormGroup.valid) {
        this.onBtnSaveClicked();
      }
    }
  }

  // Overall Charge
  updateOverallPrice() {
    const overallCharges = [];

    this.apiPatientVisitService
      .paymentCheckInvoice(this.store.getPatientVisitRegistryId(), this.consultationInfo)
      .subscribe(
        res => {
          const invoice = res.payload;
          overallCharges.push({
            paymentMode: 'Total Amount',
            charge: invoice.totalAmount - invoice.includedGstAmount,
            gst: invoice.includedGstAmount
          });
          invoice.creditPayments.forEach(creditPayment => {
            const coverage = this.patientCoverages.find(val => val.id === creditPayment.medicalCoverageId);
            const plan = coverage.coveragePlans.find(val => val.id === creditPayment.planId);
            const charges = {
              paymentMode: `${coverage.name}\n${plan.name}`,
              charge: creditPayment.amount - creditPayment.totalGst,
              gst: creditPayment.totalGst
            };
            overallCharges.push(charges);
          });
          overallCharges.push({
            paymentMode: 'Cash',
            charge: invoice.directPayments.amount - invoice.directPayments.totalGst,
            gst: invoice.directPayments.totalGst
          });

          const overallChargeFormGroup = this.chargeFormGroup.get('overallChargeFormGroup');
          overallChargeFormGroup.patchValue({
            overallCharges: { value: overallCharges }
          });
        },
        err => this.alertService.error(JSON.stringify(err.error.message))
      );
  }

  /* concurrent access */
  checkConcurrentTempStore() {
    this.tempStore.tempStoreRetrieve(this.postConsultTempStoreKey).subscribe(
      res => {
        if (res.payload || { value: '' }.value) {
          const list: Array<string> = JSON.parse(res.payload.value);
          list.map(item => this.userIdSet.add(item));

          if (
            this.userIdSet.size > 1 ||
            (this.userIdSet.size === 1 && !this.userIdSet.has(this.store.getUser().userName))
          ) {
            this.alertService.warn('This page is being access by another user. Please verify before making changes');
          }
        }

        if (!this.userIdSet.has(this.store.getUser().userName)) {
          this.userIdSet.add(this.store.getUser().userName);
          this.updateCouncurrentTempStore();
        }
      },
      err => this.alertService.error(JSON.stringify(err.error.message))
    );
  }

  updateCouncurrentTempStore() {
    this.tempStore.tempStore(this.postConsultTempStoreKey, JSON.stringify(this.userIdSet)).subscribe(
      res => {
        console.log('post consult set temp store', res.payload.value);
      },
      err => this.alertService.error(JSON.stringify(err.error.message))
    );
  }

  removeConcurrentRecord() {
    if (!this.postConsultTempStoreKey) {
      return;
    }
    console.log('remove multi access');
    this.tempStore.tempStoreRetrieve(this.postConsultTempStoreKey).subscribe(res => {
      console.log('remove multi access', res);
      if (res.payload || { value: '' }.value) {
        this.userIdSet = new Set(JSON.parse(res.payload.value));
      }

      if (this.userIdSet.size === 1 && this.userIdSet.values().next().value === this.store.getUser().userName) {
        this.tempStore.tempStoreRemove(this.postConsultTempStoreKey).subscribe(res => {
          console.log('remove multi access all record', res);
        });
      } else {
        this.userIdSet.delete(this.store.getUser().userName);
        this.tempStore.tempStore(this.postConsultTempStoreKey, JSON.stringify(this.userIdSet)).subscribe(res => {
          console.log('remove multi access single record', res);
        });
      }
    });
  }

  removeConcurrentRecordSync() {
    //retreive temp store
    if (!this.postConsultTempStoreKey) {
      return;
    }

    const response = this.tempStore.tempStoreRetrieveInSync(this.postConsultTempStoreKey);
    const responseObj = JSON.parse(response) || {};
    if (responseObj.payload || { value: '' }.value) {
      console.log(responseObj.payload.value);
      this.userIdSet = new Set(JSON.parse(responseObj.payload.value));

      let removeResponse;
      if (this.userIdSet.size === 1 && this.userIdSet.values().next().value === this.store.getUser().userName) {
        removeResponse = this.tempStore.tempStoreRemoveInSync(this.postConsultTempStoreKey);
      } else {
        this.userIdSet.delete(this.store.getUser().userName);
        removeResponse = this.tempStore.tempStoreInSync(this.postConsultTempStoreKey, JSON.stringify(this.userIdSet));
      }
      console.log(removeResponse);
    }
  }
  /* END concurrent access */
}
