import { billTemplate } from './../views/templates/bill';
import { drugLabelTemplate } from './../views/templates/drug.label';
import { patientLabelTemplate } from './../views/templates/patient.label';
import { medicalCertificateTemplate } from './../views/templates/medical.certificate';
import { memoTemplate } from './../views/templates/memo';
import { vaccinationCertificateTemplate } from './../views/templates/vaccination.certificate';
import { timeChitTemplate } from './../views/templates/time.chit';
import { NgxPermissionsService } from 'ngx-permissions';
import { DISPLAY_DATE_FORMAT, DB_FULL_DATE_FORMAT } from './../constants/app.constants';

import { Injectable } from '@angular/core';

import { ApiPatientVisitService } from './api-patient-visit.service';
import { AlertService } from './alert.service';
import { ApiCmsManagementService } from './api-cms-management.service';
import { PaymentService } from './payment.service';
import { StoreService } from './store.service';

import * as moment from 'moment';
import { refferalLetterTemplate } from '../views/templates/refferal.letter';

@Injectable()
export class PrintTemplateService {
  paymentInfo;
  medicalCoverageInfo;

  clinic;

  constructor(
    private apiPatientVisitService: ApiPatientVisitService,
    private permissionsService: NgxPermissionsService,
    private apiCmsManagementService: ApiCmsManagementService,
    private alertService: AlertService,
    private store: StoreService
  ) { }

  ngOnInit() {
    this.medicalCoverageInfo = this.store.medicalCoverageList;
    this.clinic = this.store.clinic;
  }

  onBtnPrintPatientLabelClicked(patientInfo) {
    this.apiCmsManagementService.searchLabel('PATIENT_LABEL').subscribe(
      res => {
        const template = JSON.parse(res.payload.template);
        const patient = patientInfo;
        const clinic = this.store.clinic;
        console.log("patient id: ", patient);
        const html = template
          .replace(
            '{{clinicAddress}}',
            `${clinic.address.address.toUpperCase() || ''}, SINGAPORE ${clinic.address.postalCode}`
          )
          .replace('{{clinicTel}}', clinic.contactNumber)
          .replace('{{clinicFax}}', clinic.faxNumber)
          .replace('{{id}}', patient.patientNumber)
          .replace('{{name}}', patient.name.toUpperCase())
          .replace('{{gender}}', patient.gender)
          .replace('{{dob}}', patient.dob)
          .replace('{{userIdType}}', patient.userId.idType)
          .replace('{{userId}}', patient.userId.number)
          .replace('{{contact}}', patient.contactNumber.number)
          .replace(
            '{{address}}',
            `${patient.address.address}, ${patient.address.postalCode}`
            // `${patient.address.address}, ${patient.address.country} ${patient.address.postalCode}`
          )
          .replace('{{company}}', patient.company ? patient.company.name : '')
          .replace(
            '{{allergies}}',
            patient.allergies && patient.allergies.length
              ? patient.allergies.map(allergy => allergy.name).join(', ')
              : 'NIL'
          );
        this.printTemplate(html);
      },
      err => this.alertService.error(JSON.stringify(err.error['message']))
    );
  }

  onPrintBillReceipt(patientInfo, paymentInfo, receiptType, draft) {

    const patient = patientInfo;
    const clinic = this.store.clinic;

    this.paymentInfo = paymentInfo;



    this.apiPatientVisitService.consultationSearchByPatientRegistry(this.store.getPatientVisitRegistryId()).subscribe(
      res => {
        const consultationInfo = res.payload;
        const consultDoctor = this.store.getDoctorList().find(doctor => doctor.id === consultationInfo.doctorId) || '';
        const currentUser = this.store.getUser();
        let currentUserName = '';
        if (this.permissionsService.getPermission('ROLE_DOCTOR') && !this.permissionsService.getPermission('ROLE_CA')) {
          // Doctor Role
          currentUserName = consultDoctor.name;
        } else {
          // CA / Other Rolew
          currentUserName = currentUser.firstName + ' ' + currentUser.lastName;
        }
        this.apiCmsManagementService.searchDiagnosisByIds(consultationInfo.diagnosisIds).subscribe(
          res => {
            const diagnosis = res.payload.map(d => `${d.icd10Code} [${d.icd10Term}]`);

            this.apiCmsManagementService.searchLabel('BILL').subscribe(
              res => {
                const template = JSON.parse(res.payload.template);
                const receiptTitle = draft ? 'DRAFT' : 'OFFICIAL';

                const drugCharges = this.paymentInfo.drugs;
                const medicalServiceCharges = this.paymentInfo.medicalServices;
                const medicalTestCharges = this.paymentInfo.medicalTests;
                const immunizationCharges = this.paymentInfo.vaccinations;

                const drugTotalCharge = drugCharges.reduce((sum, obj) => (sum += this.getCalculatedPrice(obj)), 0);
                const medicalServiceTotalCharge = medicalServiceCharges.reduce(
                  (sum, obj) => (sum += this.getCalculatedPrice(obj)),
                  0
                );
                const medicalTestTotalCharge = medicalTestCharges.reduce(
                  (sum, obj) => (sum += this.getCalculatedPrice(obj)),
                  0
                );
                const immunizationTotalCharge = immunizationCharges.reduce(
                  (sum, obj) => (sum += this.getCalculatedPrice(obj)),
                  0
                );

                let drugTotalChargeString =
                  drugTotalCharge > 0
                    ? this.mapToHtmlBoldNameAndValue([
                      {
                        name: 'DRUGS',
                        price: drugTotalCharge
                      }
                    ])
                    : '';

                let medicalServiceTotalChargeString =
                  medicalServiceTotalCharge > 0
                    ? this.mapToHtmlBoldNameAndValue([
                      {
                        name: 'MEDICAL SERVICES',
                        price: medicalServiceTotalCharge
                      }
                    ])
                    : '';

                let medicalTestTotalChargeString =
                  medicalTestTotalCharge > 0
                    ? this.mapToHtmlBoldNameAndValue([
                      {
                        name: 'MEDICAL TESTS',
                        price: medicalTestTotalCharge
                      }
                    ])
                    : '';

                let immunizationTotalChargeString =
                  immunizationTotalCharge > 0
                    ? this.mapToHtmlBoldNameAndValue([
                      {
                        name: 'IMMUNIZATIONS',
                        price: immunizationTotalCharge
                      }
                    ])
                    : '';

                const adjustment = this.paymentInfo.directPayments.cashRoundAdjustedValue || 0;
                const totalCharge = this.paymentInfo.totalBillAmount || 0;
                const gstTotalCharge = this.paymentInfo.includedTotalGstAmount || 0;
                const subTotalCharge = totalCharge - gstTotalCharge;
                const consultationTotalCharge = totalCharge - gstTotalCharge;
                const consultation = this.mapToHtmlBoldNameAndValue([
                  {
                    name: 'CONSULTATION / MEDICATION',
                    price: consultationTotalCharge
                  }
                ]);

                const payments = this.displayPaymentInfo(
                  draft,
                  this.paymentInfo.creditPayments,
                  this.paymentInfo.directPayments,
                  'breakdown'
                );

                console.log("payments: ", payments);


                const charges =
                  "<div class='section-avoid-break'>" +
                  this.mapToHtmlNoBold([
                    {
                      name: 'SUBTOTAL CHARGE',
                      price: subTotalCharge
                    }
                  ]) +
                  this.mapToHtmlNoBold([
                    {
                      name: 'GST@7%',
                      price: gstTotalCharge
                    }
                  ]) +
                  this.mapToHtmlBoldNameAndValue([
                    {
                      name: 'TOTAL CHARGE',
                      price: totalCharge
                    }
                  ]) +
                  payments +
                  '<br></div>';

                const paymentModes = draft
                  ? '-'
                  : this.displayPaymentInfo(
                    draft,
                    this.paymentInfo.creditPayments,
                    this.paymentInfo.directPayments,
                    'summary'
                  );

                const billNumberString = 'Invoice No: ' + (draft ? '-' : paymentInfo.billNumber || '');

                let html = template
                  .replace('{{receiptTitle}}', receiptTitle)
                  .replace(
                    '{{clinicAddress}}',
                    `${clinic.address.address.toUpperCase() || ''}, SINGAPORE ${clinic.address.postalCode}`
                  )
                  .replace('{{companyRegistrationNumber}}', (clinic.companyRegistrationNumber ? clinic.companyRegistrationNumber : ''))
                  .replace('{{gstRegistrationNumber}}', (clinic.gstRegistrationNumber ? clinic.gstRegistrationNumber : ''))
                  .replace('{{clinicName}}', `${clinic.name}`)
                  .replace('{{clinicTel}}', clinic.contactNumber)
                  .replace('{{clinicFax}}', clinic.faxNumber)
                  .replace('{{patientName}}', patient.name)
                  .replace('{{patientUserIdType}}', patient.userId.idType)
                  .replace('{{patientUserId}}', patient.userId.number)
                  .replace('{{diagnosis}}', diagnosis.length ? '' : diagnosis.join(', '))
                  .replace('{{doctorName}}', consultDoctor.name)
                  .replace('{{billNo}}', billNumberString)
                  .replace(
                    '{{billDate}}',
                    moment(this.paymentInfo.billPaymentTime, DB_FULL_DATE_FORMAT).format(DISPLAY_DATE_FORMAT)
                  )
                  .replace('{{paymentModes}}', paymentModes)
                  // .replace('{{subTotalCharge}}', `$${subTotalCharge.toFixed(2)}`)
                  // .replace('{{gstTotalCharge}}', `$${gstTotalCharge.toFixed(2)}`)
                  // .replace('{{totalCharge}}', `$${totalCharge.toFixed(2)}`)
                  // .replace('{{payments}}', payments);
                  .replace('{{charges}}', charges)
                  .replace('{{assistantName}}', `${currentUserName}`)
                  .replace(
                    '{{visitDate}}',
                    moment(consultationInfo.consultationStartTime, DB_FULL_DATE_FORMAT).format(DISPLAY_DATE_FORMAT)
                  )
                  .replace('{{printDate}}', moment().format(DISPLAY_DATE_FORMAT));

                if (receiptType === 'breakdown') {
                  const drugs = this.mapToHtml(
                    this.paymentInfo.drugs.map(price => {
                      const detail = this.store.getDrugList().find(detail => detail.id === price.itemId);
                      return {
                        name: `${detail.name} [${detail.code}]`.toUpperCase(),
                        price: this.getCalculatedPrice(price)
                      };
                    })
                  );
                  const medicalServices = this.mapToHtml(
                    this.paymentInfo.medicalServices.map(price => {

                      const info = consultationInfo.medicalServiceGiven.medicalServices.find(
                        info => {
                          return info.serviceItemId === price.itemId;
                        }
                      );

                      const detail = this.store.getMedicalServiceList().find(detail => detail.id === info.serviceId);
                      const itemDetail = detail.medicalServiceItemList.find(itemDetail => itemDetail.id === info.serviceItemId);
                      return {
                        name: `${itemDetail.description} [${detail.description}]`.toUpperCase(),
                        price: this.getCalculatedPrice(price)
                      };
                    })
                  );
                  const medicalTests = this.mapToHtml(
                    this.paymentInfo.medicalTests.map(price => {
                      const info = consultationInfo.issuedMedicalTest.issuedMedicalTestDetails.find(
                        info => info.testId === price.itemId
                      );
                      const detail = this.store.getMedicalTestList().find(detail => detail.id === info.testId);
                      return {
                        name: `${detail.name} [${detail.category}]`.toUpperCase(),
                        price: this.getCalculatedPrice(price)
                      };
                    })
                  );
                  const immunizations = this.mapToHtml(
                    this.paymentInfo.vaccinations.map(price => {
                      const info = consultationInfo.immunisationGiven.immunisation.find(
                        info => info.doseId === price.itemId
                      );
                      const detail = this.store.getVacinnationList().find(detail => detail.id === info.vaccinationId);
                      const itemDetail = detail.doses.find(itemDetail => itemDetail.doseId === info.doseId);
                      return {
                        name: `${itemDetail.description} [${detail.code}]`.toUpperCase(),
                        price: this.getCalculatedPrice(price)
                      };
                    })
                  );

                  drugTotalChargeString =
                    drugTotalCharge > 0
                      ? "<div class='section-avoid-break'>" + drugTotalChargeString + drugs.join('\n') + '<br></div>'
                      : '';
                  medicalServiceTotalChargeString =
                    medicalServiceTotalCharge > 0
                      ? "<div class='section-avoid-break'>" +
                      medicalServiceTotalChargeString +
                      medicalServices.join('\n') +
                      '<br></div>'
                      : '';
                  medicalTestTotalChargeString =
                    medicalTestTotalCharge > 0
                      ? "<div class='section-avoid-break'>" +
                      medicalTestTotalChargeString +
                      medicalTests.join('\n') +
                      '<br></div>'
                      : '';
                  immunizationTotalChargeString =
                    immunizationTotalCharge > 0
                      ? "<div class='section-avoid-break'>" +
                      immunizationTotalChargeString +
                      immunizations.join('\n') +
                      '</div>'
                      : '';

                  html = html
                    .replace('{{drugs}}', drugTotalChargeString)
                    .replace('{{medicalServices}}', medicalServiceTotalChargeString)
                    .replace('{{medicalTests}}', medicalTestTotalChargeString)
                    .replace('{{immunizations}}', immunizationTotalChargeString);
                  html = html.replace('{{consultation}}', '');
                } else {
                  html = html
                    .replace('{{drugs}}', '')
                    .replace('{{medicalServices}}', '')
                    .replace('{{medicalTests}}', '')
                    .replace('{{immunizations}}', '');
                  html = html.replace('{{consultation}}', consultation);
                }
                this.printTemplate(html);
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


  displayPaymentInfo(draft, creditPayments, directPayments, checkIsSummaryOrBreakdown) {
    let breakdownString = '';
    let summaryString = '';
    let cashOnly = false;

    creditPayments.forEach(payment => {
      if (payment.amount > 0) {
        const coverageName = this.getCoverageName(payment.medicalCoverageId, payment.planId);
        breakdownString += this.mapToHtmlBoldNameAndValue([
          {
            name: 'PAY BY ' + coverageName,
            price: payment.amount
          }
        ]);

        summaryString += summaryString === '' ? coverageName : ' / ' + coverageName;
        console.log("summary string credit: ", summaryString);
      }
    });

    let dprice = directPayments.amount - directPayments.cashRoundAdjustedValue;

    if (!draft) {
      if (directPayments.paymentInfos.length === 1 && directPayments.paymentInfos[0].billMode === "CASH" && directPayments.cashRoundAdjustedValue > 0) // Pay By Cash Only
      {
        // cashOnly = true;
        breakdownString +=
          this.mapToHtmlAdjustment(
            [
              {
                name: 'ADJUSTMENT',
                price: directPayments.cashRoundAdjustedValue
              }
            ]
          ) + this.mapToHtmlDisplayAdjustment(dprice);
        summaryString += summaryString === '' ? 'CASH' : ' / CASH'

      } else {
        directPayments.paymentInfos.forEach((paymentInfo, counter) => {
          let billMode: string = paymentInfo.billMode;
          // billMode = billMode.replace("_", " ").replace("_", " ");
          billMode = billMode.replace(/_/g, " ");

          breakdownString += this.mapToHtmlBoldNameAndValue([
            {
              name: 'PAY BY ' + billMode,
              price: paymentInfo.amount
            }
          ]);

          summaryString += summaryString === '' ? billMode : " / " + billMode;
          console.log("summary string direct: ", summaryString);
        });


      }
    } else { // DRAFT RECEIPT
      console.log("DRAFT!");
      breakdownString +=
        this.mapToHtmlBoldNameAndValue(
          [
            {
              name: 'OUTSTANDING BALANCE',
              price: directPayments.amount
            }
          ]
        );
    }

    return checkIsSummaryOrBreakdown === 'summary' ? summaryString : breakdownString;
  }

  getCoverageName(medicalCoverageId, planId) {
    this.medicalCoverageInfo = this.store.medicalCoverageList;

    const coverage = this.medicalCoverageInfo.find(function (x) {
      return x.id === medicalCoverageId;
    });

    const coveragePlan = coverage.coveragePlans.find(function (x) {
      return x.id === planId;
    });

    // return coveragePlan.name.toUpperCase();
    return coverage.name.toUpperCase();
  }



  updateLabelTemplate(id, templateName, template) {
    this.apiCmsManagementService.updateLabel(id, templateName, JSON.stringify(template)).subscribe(
      res => {
        console.log(res);
      },
      err => console.log(err)
    );
  }

  updateAllLabelTemplates() {
    // this.apiCmsManagementService
    //   .updateLabel('5ae03f77dbea1b12fe7d6685', 'BILL', JSON.stringify(billTemplate))
    //   .subscribe(
    //     res => {
    //       console.log(res);
    //     },
    //     err => console.log(err)
    //   );

    // this.apiCmsManagementService
    //   .updateLabel('5ae03f77dbea1b12fe7d6687', 'MEDICAL_CERTIFICATE', JSON.stringify(medicalCertificateTemplate))
    //   .subscribe(
    //     res => {
    //       console.log(res);
    //     },
    //     err => console.log(err)
    //   );

    // this.apiCmsManagementService
    //   .updateLabel('5ae03f77dbea1b12fe7d6686', 'DRUG_LABEL', JSON.stringify(drugLabelTemplate))
    //   .subscribe(
    //     res => {
    //       console.log(res);
    //     },
    //     err => console.log(err)
    //   );

    this.apiCmsManagementService
      .updateLabel('5ae03f77dbea1b12fe7d668a', 'REFERRAL_LETTER', JSON.stringify(refferalLetterTemplate))
      .subscribe(
        res => {
          console.log(res);
        },
        err => console.log(err)
      );

    // this.apiCmsManagementService
    //   .updateLabel('5ae03f77dbea1b12fe7d6689', 'TIME_CHIT', JSON.stringify(timeChitTemplate))
    //   .subscribe(
    //     res => {
    //       console.log(res);
    //     },
    //     err => console.log(err)
    //   );

    // this.apiCmsManagementService
    //   .updateLabel('5ae14ab0dbea1b35bbaa310e', 'PATIENT_LABEL', JSON.stringify(patientLabelTemplate))
    //   .subscribe(
    //     res => {
    //       console.log(res);
    //     },
    //     err => console.log(err)
    //   );

    // this.apiCmsManagementService
    //   .updateLabel(
    //     '5ae2ae6bdbea1b35bbaa310f',
    //     'VACCINATION_CERTIFICATE',
    //     JSON.stringify(vaccinationCertificateTemplate)
    //   )
    //   .subscribe(
    //     res => {
    //       console.log(res);
    //     },
    //     err => console.log(err)
    //   );

    this.apiCmsManagementService
      .updateLabel('5b1f9ef8bf8d8d03a16fd8ed', 'MEMO', JSON.stringify(memoTemplate))
      .subscribe(
        res => {
          console.log(res);
        },
        err => console.log(err)
      );
  }

  mapToHtml(array) {
    return array.map(
      obj => `<div class="row">
            <div class="col-6">
                ${obj.name}
            </div>
            <div class="col-4">
                <span class="float-right">
                    $${obj.price.toFixed(2)}
                </span>
            </div>
        </div>`
    );
  }

  mapToHtmlAdjustment(array) {
    return array.map(
      obj => `<div class="row">
            <div class="col-6">
                ${obj.name}
            </div>
            <div class="col-6">
                <span class="float-right">
                    ($${obj.price.toFixed(2)})
                </span>
            </div>
        </div>`
    );
  }

  mapToHtmlNoBold(array) {
    return array.map(
      obj => `<div class="row">
            <div class="col-6">
                ${obj.name}
            </div>
            <div class="col-6">
                <span class="float-right">
                    $${obj.price.toFixed(2)}
                </span>
            </div>
        </div>`
    );
  }

  mapToHtmlBoldNameOnly(array) {
    return array.map(
      obj => `<div class="row">
            <div class="col-6">
                ${obj.name}
            </div>
            <div class="col-6">
                <span class="float-right">
                    $${obj.price.toFixed(2)}
                </span>
            </div>
        </div>`
    );
  }

  mapToHtmlBoldNameAndValue(array) {
    return array.map(
      obj => `<div class="row">
            <div class="col-6">
              <strong>
                ${obj.name}
              </strong>
            </div>
            <div class="col-6">
              <strong>
                <span class="float-right">
                    $${obj.price.toFixed(2)}
                </span>
              </strong>
            </div>
        </div>`
    );
  }

  mapToHtmlDisplayAdjustment(price) {
    return `<div class="row">
              <div class="col-6">
                <span>
                  <strong>PAY BY CASH </strong><small>(AFTER ADJUSTMENT)</small>
                </span>
              </div>
              <div class="col-6">
                  <span class="float-right">
                    <strong>
                      $${price.toFixed(2)}
                    </strong>
                  </span>
              </div>
            </div>`;
  }

  printTemplate(template: string) {
    const w = window.open();
    w.document.open();
    w.document.write(template);
    w.document.close();
    console.log('document closed');
    w.onload = () => {
      console.log('window loaded');
      w.window.print();
    };
    w.onafterprint = () => {
      w.close();
    };
  }

  // Calculate discounted price
  getCalculatedPrice(p: ChargeItem) {
    if (p.discountGiven.paymentType === 'DOLLAR') {
      if (p.discountGiven.increaseValue > 0) {
        return (p.charge.price + p.discountGiven.increaseValue) * p.quantity;
      } else {
        return (p.charge.price - p.discountGiven.decreaseValue) * p.quantity;
      }
    } else {
      if (p.discountGiven.increaseValue > 0) {
        return p.charge.price * (1 + p.discountGiven.increaseValue / 100) * p.quantity;
      } else {
        return p.charge.price * (1 - p.discountGiven.decreaseValue / 100) * p.quantity;
      }
    }
  }
}

class ChargeItem {
  charge: Charge;
  discountGiven: DiscountGiven;
  itemCode: string;
  itemId: string;
  quantity: number;
}

class Charge {
  price: number;
  taxIncludeds: boolean;
}

class DiscountGiven {
  decreaseValue: number;
  increaseValue: number;
  paymentType: string;
}
