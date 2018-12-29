import { Component, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationStart } from '@angular/router';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import * as moment from 'moment';

import { StoreService } from '../../../../services/store.service';
import { AlertService } from '../../../../services/alert.service';
import { DialogService } from '../../../../services/dialog.service';
import { ApiPatientInfoService } from '../../../../services/api-patient-info.service';
import { ApiPatientVisitService } from '../../../../services/api-patient-visit.service';
import { ApiCmsManagementService } from '../../../../services/api-cms-management.service';
import { PaymentService } from '../../../../services/payment.service';
import { PaymentConfirmComponent } from '../../../../components/payment/payment-confirm/payment-confirm.component';
import { PaymentSelectionComponent } from '../../../../components/payment/payment-selection/payment-selection.component';

import { DISPLAY_DATE_FORMAT, DB_FULL_DATE_FORMAT } from '../../../../constants/app.constants';
import { billTemplate } from '../../../templates/bill';
import { NgxPermissionsService } from 'ngx-permissions';
import { PrintTemplateService } from './../../../../services/print-template.service';
import { TempStoreService } from '../../../../services/temp-store.service';

@Component({
  selector: 'app-payment-collect',
  templateUrl: './payment-collect.component.html',
  styleUrls: ['./payment-collect.component.scss']
})
export class PaymentCollectComponent implements OnInit {
  consultationInfo;
  collectFormGroup: FormGroup;
  bsModalRef: BsModalRef;

  patientInfo;
  paymentInfo;
  billNo;
  factor = 0.05;

  error: string;
  routerEventsSubscribe;
  isRollbacked = false;
  navigatingUrl: string;
  multipleAccessKey: string;
  currentUserAccessing: Set<string>;

  disablePayBtn: Boolean = true;
  isLessThan: Boolean = false;

  constructor(
    private router: Router,
    private location: Location,
    private store: StoreService,
    private alertService: AlertService,
    private dialogService: DialogService,
    private modalService: BsModalService,
    private apiPatientInfoService: ApiPatientInfoService,
    private apiPatientVisitService: ApiPatientVisitService,
    private tempStore: TempStoreService,
    private paymentService: PaymentService,
    private printTemplateService: PrintTemplateService,
    private apiCmsManagementService: ApiCmsManagementService
  ) {
    this.multipleAccessKey = `PAYMENT_${this.store.getPatientVisitRegistryId()}`;
    this.currentUserAccessing = new Set();
  }

  ngOnInit() {
    if (!this.store.getPatientId()) {
      alert('No Patient Details');
      this.router.navigate(['pages/patient/list']);
      return;
    }

    /** MULTIPLE ACCESS */
    this.checkMultipleUserAccess();
    /** END OF MULTIPLE ACCESS */

    this.collectFormGroup = this.paymentService.getCollectFormGroup();
    this.apiPatientInfoService.searchBy('systemuserid', this.store.getPatientId()).subscribe(
      res => {
        const patientInfo = (this.patientInfo = res.payload);

        //   this.collectFormGroup.get('patientInfoFormGroup').patchValue({
        //     patientNo: patientInfo.id,
        //     patientName: patientInfo.name,
        //     age: moment().diff(moment(patientInfo.dob, DISPLAY_DATE_FORMAT), 'years'),
        //     sex: patientInfo.gender,
        //     dateOfBirth: patientInfo.dob,
        //     NRIC: patientInfo.userId.number,
        //     occupation: patientInfo.company ? patientInfo.company.occupation : '-',
        //     address: `${patientInfo.address.address}, ${patientInfo.address.country} ${patientInfo.address.postalCode}`
        //   });
      },
      err => this.alertService.error(JSON.stringify(err.error.message))
    );

    this.consultationInfo = this.paymentService.getConsultationInfo();
    if (!this.consultationInfo) {
      this.apiPatientVisitService.patientVisitSearch(this.store.getPatientVisitRegistryId()).subscribe(
        res => {
          this.paymentInfo = res.payload.billPayment;
          this.updateCollectChargeFormGroup();
          this.updatePaymentMethodFormGroup();
        },
        err => this.alertService.error(JSON.stringify(err.error.message))
      );
    } else {
      this.consultationInfo.executeOnlyTest = false;
      this.apiPatientVisitService.payment(this.store.getPatientVisitRegistryId(), this.consultationInfo).subscribe(
        res => {
          this.paymentInfo = res.payload;
          this.updateCollectChargeFormGroup();
          this.updatePaymentMethodFormGroup();
        },
        err => this.alertService.error(JSON.stringify(err.error.message))
      );
    }

    this.collectFormGroup
      .get('paymentFormGroup')
      .get('paymentArray')
      .valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(
        values => {
          console.log('this payment info: ', this.paymentInfo);
          console.log('values: ', values);

          const payingMethod = (values as Array<any>).filter(item => item.amount > 0);
          this.collectFormGroup.get('collectChargeFormGroup').patchValue(
            {
              payCashOnly: payingMethod.length === 1 && payingMethod[0].payment === 'CASH'
            },
            { emitEvent: false }
          );
        },
        err => this.alertService.error(JSON.stringify(err.error.message))
      );

    this.collectFormGroup
      .get('paymentFormGroup')
      .get('outstanding')
      .valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(value => {
        this.checkDisablePayBtn(value);

        this.isLessThan = Number(value) > 0;
      });

    this.routerEventsSubscribe = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.navigatingUrl = event.url;
        if (event.url === '/pages/payment/charge' && !this.isRollbacked) {
          const confirm = this.dialogService.confirm(
            'Your changes will be rolled back. \n\nAre you sure want to leave this page?'
          );
          confirm.subscribe(isConfirm => {
            if (isConfirm) {
              this.apiPatientVisitService.paymentRollback(this.paymentInfo.patientVisitId).subscribe(
                res => {
                  this.isRollbacked = true;
                  this.router.navigate([event.url]);
                },
                err => this.alertService.error(JSON.stringify(err.error.message))
              );
            }
          });
        }
      }
    });
  }

  checkMultipleUserAccess() {
    const currentUserName = this.store.getUser().userName;
    this.tempStore.tempStoreRetrieve(this.multipleAccessKey).subscribe(
      res => {
        if (res && res.statusCode && res.statusCode === 'S0000') {
          if (res.payload) {
            const dataJsonString = res.payload.value;
            this.currentUserAccessing = new Set(JSON.parse(dataJsonString));
            if (this.currentUserAccessing.size > 0) {
              this.alertService.warn('This page is being access by another user. Please verify before making changes');
            }
            if (!this.currentUserAccessing.has(currentUserName)) {
              // Add Current User to Set
              this.currentUserAccessing.add(currentUserName);
              // Convert Data to JSON String and store into tempstore
              const dataToJsonString = JSON.stringify(Array.from(this.currentUserAccessing));
              this.tempStore.tempStore(this.multipleAccessKey, dataToJsonString).subscribe(
                result => {
                  console.log('PAYMENT_TEMP_STORE', result);
                },
                err => {
                  this.alertService.error(JSON.stringify(err.error.message));
                }
              );
            }
          } else {
            //Add new Set
            const data = new Set();
            data.add(currentUserName);
            // Convert Data to JSON String and store into tempstore
            const dataToJsonString = JSON.stringify(Array.from(data));
            this.tempStore.tempStore(this.multipleAccessKey, dataToJsonString).subscribe(
              result => {
                console.log('PAYMENT_TEMP_STORE', res);
              },
              err => {
                this.alertService.error(JSON.stringify(err.error.message));
              }
            );
          }
        }
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );
  }

  ngOnDestroy() {
    if (this.routerEventsSubscribe) {
      this.routerEventsSubscribe.unsubscribe();
    }
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (this.navigatingUrl === '/pages/payment/charge') {
      if (this.isRollbacked) {
        this.paymentService.resetChargeFormGroup();
        this.paymentService.resetCollectFormGroup();
      }
      return this.isRollbacked;
    }
    this.removeCurrentUserFromTempStore();
    // this.apiCmsManagementService.tempStoreRemove(this.multipleAccessKey).subscribe(resss => {}, err => {});
    return true;
  }

  async removeCurrentUserFromTempStore() {
    await this.tempStore
      .tempStoreRetrieve(this.multipleAccessKey)
      .toPromise()
      .then(res => {
        if (res && res.statusCode && res.statusCode === 'S0000') {
          if (res.payload) {
            const dataJsonString = res.payload.value;
            this.currentUserAccessing = new Set(JSON.parse(dataJsonString));
          }
        }
      })
      .catch(err => this.alertService.error(JSON.stringify(err.error.message)));

    this.currentUserAccessing.delete(this.store.getUser().userName);

    console.log('PAYMENT_TEMP_STORE', this.currentUserAccessing);
    if (this.currentUserAccessing.size > 0) {
      //update
      const dataToJsonString = JSON.stringify(Array.from(this.currentUserAccessing));
      await this.tempStore
        .tempStore(this.multipleAccessKey, dataToJsonString)
        .toPromise()
        .then(result => {
          console.log('PAYMENT_TEMP_STORE', result);
        })
        .catch(err => {});
    } else {
      // delete
      await this.tempStore
        .tempStoreRemove(this.multipleAccessKey)
        .toPromise()
        .then(resss => {})
        .catch(err => {});
    }
  }

  removeConcurrentRecordSync() {
    //retreive temp store
    if (!this.multipleAccessKey) {
      return;
    }

    const response = this.tempStore.tempStoreRetrieveInSync(this.multipleAccessKey);
    const responseObj = JSON.parse(response) || {};
    if (responseObj.payload || { value: '' }.value) {
      console.log(responseObj.payload.value);
      this.currentUserAccessing = new Set(JSON.parse(responseObj.payload.value));

      let removeResponse;
      if (
        this.currentUserAccessing.size === 1 &&
        this.currentUserAccessing.values().next().value === this.store.getUser().userName
      ) {
        removeResponse = this.tempStore.tempStoreRemoveInSync(this.multipleAccessKey);
      } else {
        this.currentUserAccessing.delete(this.store.getUser().userName);
        removeResponse = this.tempStore.tempStoreInSync(
          this.multipleAccessKey,
          JSON.stringify(this.currentUserAccessing)
        );
      }
      console.log(removeResponse);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler($event: any) {
    this.removeConcurrentRecordSync();
    return false;
  }

  // Lifecycle
  updateCollectChargeFormGroup() {
    console.log('Payment Info', this.paymentInfo);
    const otherCharge =
      <number>this.paymentInfo.directPayments.amount - <number>this.paymentInfo.directPayments.totalGst;
    const otherChargeGst = this.paymentInfo.directPayments.totalGst;
    const cashRoundAdjustedValue = this.paymentInfo.directPayments.cashRoundAdjustedValue;
    this.collectFormGroup.get('collectChargeFormGroup').patchValue({
      otherCharge,
      otherChargeGst,
      cashRoundAdjustedValue
    });
    this.paymentService.setCollectFormGroup(this.collectFormGroup);
  }

  updatePaymentMethodFormGroup() {
    console.log('Payment Info', this.paymentInfo);
    const otherCharge =
      <number>this.paymentInfo.directPayments.amount - <number>this.paymentInfo.directPayments.totalGst;
    const otherChargeGst = this.paymentInfo.directPayments.totalGst;
    const cashRoundAdjustedValue = this.paymentInfo.directPayments.cashRoundAdjustedValue;

    this.collectFormGroup.get('paymentFormGroup').patchValue({
      otherCharge,
      otherChargeGst,
      cashRoundAdjustedValue
    });
    
    this.checkDisablePayBtn(otherCharge.toFixed(2))
  }

  checkDisablePayBtn(outstandingStr: string) {
    const outstanding: number = Number(outstandingStr);
    const outstandingCent: string = outstanding.toFixed(2).slice(-1);

    if (outstanding > 0 || (outstandingCent !== '0' && outstandingCent !== '5')) {
      this.disablePayBtn = true;
      return;
    }

    if (outstanding < 0) {
      const payCashAmount =
        (
          (this.collectFormGroup.get('paymentFormGroup').get('paymentArray') as FormArray).value.find(
            item => item.payment === 'CASH'
          ) || { amount: 0 }
        ).amount || 0;

      if (payCashAmount < Math.abs(outstanding)) {
        this.disablePayBtn = true;
        return;
      }
    }

    this.disablePayBtn = false;
  }

  // Action
  onBtnBackClicked() {
    this.router.navigate(['/pages/payment/charge']);
  }

  onBtnSaveClicked() {
    if (this.disablePayBtn) {
      return;
    }

    this.disablePayBtn = true;

    const chargeBack = parseFloat(
      this.collectFormGroup
        .get('paymentFormGroup')
        .get('chargeBack')
        .value.toFixed(2)
    );
    if (chargeBack > 0) {
      if (confirm(`Change needed: $${chargeBack.toFixed(2)}`)) {
        this.executePay();
      } else {
        this.disablePayBtn = false;
      }
    } else {
      this.executePay();
    }
  }

  executePay() {
    let billArr = [];
    this.collectFormGroup
      .get('paymentFormGroup')
      .get('paymentArray')
      .value.forEach(payment => {
        if (payment.amount) {
          if (payment.payment === 'CASH') {
            const amount = parseFloat(
              (
                payment.amount -
                Number(
                  this.collectFormGroup
                    .get('paymentFormGroup')
                    .get('chargeBack')
                    .value.toFixed(2)
                )
              ).toFixed(2)
            );
            billArr.push({
              billMode: payment.payment,
              amount: amount,
              cashRoundAdjustedValue: amount
            });
          } else if (payment.payment === 'CHEQUE') {
            billArr.push({
              billMode: payment.payment,
              amount: payment.amount,
              externalTransactionId: payment.transactionId,
              bank: payment.bank
            });
          } else {
            billArr.push({
              billMode: payment.payment,
              amount: payment.amount,
              externalTransactionId: payment.transactionId
            });
          }
        }
      });
    if (!billArr.length) {
      billArr.push({
        billMode: 'CASH',
        amount: 0,
        cashRoundAdjustedValue: 0
      });
    } else if (billArr.length === 1) {
      const bill = billArr[0];
      if (bill.billMode === 'CASH') {
        bill.cashRoundAdjustedValue = (Math.floor(bill.amount * (1 / this.factor)) * this.factor).toFixed(2);
      }
    } else {
      billArr = billArr.filter(bill => bill.amount);
    }

    const bill = JSON.stringify(billArr);
    console.log('res billCollecterd: ', bill);

    this.apiPatientVisitService.billSearch(this.store.getPatientVisitRegistryId()).subscribe(
      res => {
        console.log('res bill1: ', res);
        const billSearch = res.payload.paymentInfos.map(bill => {
          const { billMode, amount, externalTransactionId } = bill;
          if (externalTransactionId) {
            return { billMode, amount, externalTransactionId };
          }
          return { billMode, amount };
        });
        console.log('res billSearch: ', billSearch);

        if (JSON.stringify(billSearch) !== bill) {
          this.apiPatientVisitService.billPay(this.store.getPatientVisitRegistryId(), bill).subscribe(
            res => {
              console.log('res bill2: ', res); // USE THIS res.payload.paymentInfos
              // this.paymentInfo = res.payload.paymentInfos
              console.log('payment infos: ', this.paymentInfo);
              this.paymentInfo.directPayments.paymentInfos = res.payload.paymentInfos; //what I did

              this.apiPatientVisitService.completed(this.store.getPatientVisitRegistryId()).subscribe(
                res => {
                  this.billNo = res.payload.billPaymentId;
                  const initialState = {};
                  this.bsModalRef = this.modalService.show(PaymentConfirmComponent, {
                    initialState,
                    class: 'modal-lg',
                    backdrop: 'static'
                  });

                  this.bsModalRef.content.printClicked.subscribe(isPrint => {
                    console.log('Payment Info: ', this.paymentInfo);
                    console.log('completed bill: ', res.payload);
                    this.printReceipt();
                    this.bsModalRef.hide();
                    this.router.navigate(['patient']);
                  });
                  this.bsModalRef.content.nextClicked.subscribe(isNext => {
                    this.bsModalRef.hide();
                    this.router.navigate(['patient']);
                  });
                },
                err => {
                  this.alertService.error(JSON.stringify(err.error.message));
                  this.disablePayBtn = false;
                }
              );
            },
            err => {
              this.alertService.error(JSON.stringify(err.error.message));
              this.disablePayBtn = false;
            }
          );
        } else {
          this.apiPatientVisitService.completed(this.store.getPatientVisitRegistryId()).subscribe(
            res => {
              this.billNo = res.payload.billPaymentId;
              const initialState = {};
              this.bsModalRef = this.modalService.show(PaymentConfirmComponent, {
                initialState,
                class: 'modal-lg',
                backdrop: 'static'
              });

              this.bsModalRef.content.printClicked.subscribe(isPrint => {
                this.printReceipt();
                this.bsModalRef.hide();
                this.router.navigate(['patient']);
              });
              this.bsModalRef.content.nextClicked.subscribe(isNext => {
                this.bsModalRef.hide();
                this.router.navigate(['patient']);
              });
            },
            err => {
              this.alertService.error(JSON.stringify(err.error.message));
              this.disablePayBtn = false;
            }
          );
        }
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
        this.disablePayBtn = false;
      }
    );
  }

  onKeyUp($event: KeyboardEvent) {
    if ($event.code === '0x003E' && !this.disablePayBtn) {
      this.onBtnSaveClicked();
    }
  }

  onError(err) {
    this.error = err.error.message;
    this.alertService.error(JSON.stringify(err));
    window.scroll(0, 0);
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.keyCode === 115) {
      console.log('F4');
      if (this.collectFormGroup.valid && !this.disablePayBtn) {
        this.onBtnSaveClicked();
      }
    }
  }

  // Utils

  printReceipt() {
    this.printTemplateService.onPrintBillReceipt(
      this.patientInfo,
      this.paymentInfo,
      this.collectFormGroup.get('printFormGroup').value.receiptType,
      false
    );
  }
}

class PaymentInfo {
  id: string;
  paymentStatus: string;
  gstValue: number;
  drugs: PriceInfo[];
  medicalServices: PriceInfo[];
  medicalTests: PriceInfo[];
  vaccinations: PriceInfo[];
  billId: String[];
  coverageCoPayments: object;
}

class PriceInfo {
  itemId: string;
  quantity: number;
  singleUnitPrice: number;
  userPayablePricePerUnit: number;
  gstAmountPerUnit: number;
  totalUserPayable: number;
  totalGst: number;
  paymentMode: string;
  attachedMedicalCoverages: MedicalCoverage;
}

class MedicalCoverage {
  medicalCoverageId: string;
  planId: string;
}

class Copayment {
  value: number;
  paymentType: string;
}
