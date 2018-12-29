import { Component, OnInit, ViewChild } from '@angular/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { StoreService } from '../../../../services/store.service';
import { AuthService } from '../../../../services/auth.service';
import { Router } from '@angular/router';
import { ApiCaseManagerService } from '../../../../services/api-case-manager.service';
import { AlertService } from '../../../../services/alert.service';
import { ApiPatientVisitService } from '../../../../services/api-patient-visit.service';
import { FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { CaseManagerAttachVisitComponent } from '../../../../components/case-manager/case-manager-attach-visit/case-manager-attach-visit.component';
import { CaseChargeFormService } from '../../../../services/case-charge-form.service';
import { CaseManagerNewPaymentComponent } from '../../../../components/case-manager/case-manager-new-payment/case-manager-new-payment.component';
import { CaseManagerCloseCaseComponent } from '../../../../components/case-manager/case-manager-close-case/case-manager-close-case.component';
import { CaseManagerDeletePaymentComponent } from '../../../../components/case-manager/case-manager-delete-payment/case-manager-delete-payment.component';
import { Case, VisitIds, Invoices } from '../../../../objects/Case';
import moment = require('moment');
import { CaseManagerDeleteVisitComponent } from '../../../../components/case-manager/case-manager-delete-visit/case-manager-delete-visit.component';

@Component({
  selector: 'app-case-details',
  templateUrl: './case-details.component.html',
  styleUrls: ['./case-details.component.scss']
})

export class CaseDetailsComponent implements OnInit {

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableWrapper') tableWrapper;
  @ViewChild('containerFluid') container;

  salesOrder: any;
  outstanding: string;
  visits = [];
  visit: any;
  invoices = [];
  packageCompletedItems: number;
  rows: any[];
  bsModalRef: BsModalRef;
  caseChargeForm: FormGroup;
  items: FormArray;
  chargesSummary = {
    chargesTotal: 0,
    gSTTotal: 0,
    payableTotal: 0,
    coverageTotal: 0
  }
  case: Case;
  purchasedPackageDates = {
    purchaseDate: null,
    expireDate: null
  }
  deletedInvoices: Invoices[] = [];
  newPurchaseItems = [];
  utilizeDisable = [];

  constructor(
    private store: StoreService,
    private authService: AuthService,
    private apiCaseManagerService: ApiCaseManagerService,
    private apiPatientVisitService: ApiPatientVisitService,
    private alertService: AlertService,
    private router: Router,
    private formBuilder: FormBuilder,
    private modalService: BsModalService,
    private caseChargeFormService: CaseChargeFormService
  ) { }

  ngOnInit(): void {
    if (
      localStorage.getItem('access_token') &&
      localStorage.getItem('clinicCode') &&
      localStorage.getItem('clinicId')
    ) {
      this.store.clinicCode = localStorage.getItem('clinicCode');
      this.store.clinicId = localStorage.getItem('clinicId');
    } else {
      alert('Clinic is not selected.');
      localStorage.removeItem('access_token');
      this.authService.logout();
      console.log('Access Denied');
      this.router.navigate(['login']);
    }
    this.getCaseDetails();
  }

  getCaseDetails() {
    if (this.store.getCaseId) {
      this.apiCaseManagerService.searchCase(this.store.getCaseId()).subscribe(pagedData => {
        console.log('Search Case', pagedData);
        if (pagedData) {
          const { payload } = pagedData;
          this.populateData(payload);
        }
        return pagedData;
      },
        err => {
          this.alertService.error(JSON.stringify(err.error.message));
        });
    }
  }

  populateData(data: Case) {
    this.case = data;
    this.getVisitData();
    this.outstanding = this.case.salesOrder['outstanding'];
    this.invoices = this.case.salesOrder['invoices'];
    this.formatPackageDate();
    this.getPackageCompletedItems();
    this.calculateChargeSummary();
    this.updateFormForLastPurchaseItems();
  }

  updateFormForLastPurchaseItems() {
    this.caseChargeForm = this.formBuilder.group({
      chargeItem: this.formBuilder.group({
        chargeItemDetails: this.caseChargeFormService.addMultipleChargeItems(false, this.case.salesOrder.purchaseItem.length)
      })
    });

    let formArr = this.caseChargeForm.get('chargeItem').get('chargeItemDetails')['controls']  
    if (formArr) {
      for (let i = 0; i < formArr.length; i++) {
        let purchaseItem = this.case.salesOrder.purchaseItem[i];
        formArr[i].patchValue({
          drugId: purchaseItem['itemRefId'],
          batchNumber: purchaseItem['batchNo'],
          expiryDate: purchaseItem['expireDate'],
          remark: purchaseItem['remarks'],
          dose: {
            'uom': purchaseItem['purchaseUom'],
            'quantity': purchaseItem['dosage'],
          },
          instruction: {
            'code': purchaseItem['instruct']
          },
          purchaseQty: purchaseItem['purchaseQty'],
          excludedCoveragePlanIds: purchaseItem['excludedCoveragePlanIds'],
          duration: purchaseItem['duration'],
          salesItemCode: purchaseItem['salesItemCode'],
          cost: purchaseItem.cost['price'],
          isChecked: false,
          unitPrice: {
            'price': purchaseItem.unitPrice['price'],
            'taxIncluded': purchaseItem.unitPrice['taxIncluded'],
          }
        });
      }
    }
    if(formArr != undefined && this.case.status=='CLOSED')
      formArr.forEach(element => {element.disable()});
  }

  getPackageCompletedItems() {
    this.packageCompletedItems = 0;
    let i=0;
    this.utilizeDisable = [];
    this.case.purchasedPackage.dispatches.forEach(item => {
      if (item.utilize == true) {
        this.packageCompletedItems += 1;
        this.utilizeDisable[i] = true;
      }
      else
        this.utilizeDisable[i] = false;
      i++;
    });
  }

  formatPackageDate() {
    if (this.case.purchasedPackage['purchaseDate'] != undefined && this.case.purchasedPackage['expireDate'] != undefined) {
      this.purchasedPackageDates.purchaseDate = moment(moment(this.case.purchasedPackage['purchaseDate'], 'DD-MM-YYYYT00:00:00')).format('DD-MM-YYYY');
      this.purchasedPackageDates.expireDate = moment(moment(this.case.purchasedPackage['expireDate'], 'DD-MM-YYYYT00:00:00')).format('DD-MM-YYYY');
    }
  }

  getVisitData() {
    this.apiPatientVisitService.getVisit(this.case.caseId).subscribe(data => {
      console.log('Visit ', data);
      if (data) {
        const { payload } = data;
        this.formatVisits(payload);
      }
      return data;
    },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      });
  }

  formatVisits(visits) {
    this.visits = visits.map((payload) => {
      const tempVisit = {
        visitId: payload.visitId,
        clinicName: payload.clinicName,
        visitDate: moment(moment(payload.startTime, 'DD-MM-YYYYT00:00:00')).format('DD-MM-YYYY'),
        diagnosis: payload.diagnosisEntities,
        drugDispatch: payload.medicalReferenceEntity.dispatchItemEntities
      };
      return tempVisit;
    });
    if (this.case.visitIds[0] != undefined)
      this.onClickVisitRow(this.visits[0].visitId);
  }

  onClickVisitRow(visitId) {
    this.visit = this.visits.find(obj => {
      return obj.visitId === visitId
    })
  }

  toggleExpandRow(row) {
    console.log('Toggled Expand Row!', row);
    this.table.rowDetail.toggleExpandRow(row);
  }

  backToAllCases() {
    this.router.navigate(['/pages/case/list']);
    return false;
  }

  attachNewVisit() {
    const initialState = {
      title: 'ATTACH NEW VISIT',
      patientId: this.store.getPatientId()
    };

    this.bsModalRef = this.modalService.show(CaseManagerAttachVisitComponent, {
      initialState,
      class: 'app-modal-window',
      keyboard: false,
      backdrop: 'static'
    });

    this.bsModalRef.content.event.subscribe(
      data => {
        this.getCaseDetails();
        this.bsModalRef.content.event.unsubscribe();
      },
      err => {
        this.alertService.error(err.error.message);
      }
    );
  }

  calculateChargeSummary() {
    if (this.invoices.length == 0) {
      this.chargesSummary.chargesTotal = 0;
      this.chargesSummary.gSTTotal = 0;
      this.chargesSummary.payableTotal = 0;
      this.chargesSummary.coverageTotal = 0;
    }
    else {
      this.invoices.forEach(invoice => {
        this.chargesSummary.chargesTotal += invoice["payableAmount"] - invoice["includedTaxAmount"];
        this.chargesSummary.gSTTotal += invoice["includedTaxAmount"];
        this.chargesSummary.payableTotal += Number(invoice["payableAmount"]);
        this.chargesSummary.coverageTotal += 0;
      });
    }
  }

  closeCase() {
    const initialState = {
      title: 'CLOSE CASE',
      caseId: this.store.getCaseId(),
      outstanding: this.outstanding
    };

    this.bsModalRef = this.modalService.show(CaseManagerCloseCaseComponent, {
      initialState,
      class: 'modal-sm',
      keyboard: false,
      backdrop: 'static'
    });
  }

  onDeleteVisit(visitId) {
    const initialState = {
      title: 'DELETE VISIT',
      visitId: visitId
    };

    this.bsModalRef = this.modalService.show(CaseManagerDeleteVisitComponent, {
      initialState,
      class: 'modal-sm',
      keyboard: false,
      backdrop: 'static'
    });

    this.bsModalRef.content.event.subscribe(
      data => {
        this.getCaseDetails();
        this.bsModalRef.content.event.unsubscribe();
      },
      err => {
        this.alertService.error(err.error.message);
      }
    );
  }

  createNewInvoice() {
    const initialState = {
      title: 'New Payment',
      invoices: this.case.salesOrder.invoices
    };

    this.bsModalRef = this.modalService.show(CaseManagerNewPaymentComponent, {
      initialState,
      class: 'app-modal-window',
      keyboard: false,
      backdrop: 'static'
    });
  }

  onDeletePayment(index) {
    const initialState = {
      title: 'Remove Payment?'
    };
    this.bsModalRef = this.modalService.show(CaseManagerDeletePaymentComponent, {
      initialState,
      class: 'app-modal-window',
      keyboard: false,
      backdrop: 'static'
    });
    this.bsModalRef.content.event.subscribe(data => {
      console.log('Reason -', data);
      this.deletePaymentRequest(index);
      this.deletedInvoices.push(this.invoices[index]);
      this.deletedInvoices.push(this.invoices[index]);
      this.invoices.splice(index, 1);
      this.calculateChargeSummary();
      this.bsModalRef.hide();
    });
  }

  deletePaymentRequest(index) {
    this.apiCaseManagerService.deletePayment(this.store.getCaseId(), index).subscribe(data => {
      console.log('Delete Payment', data);
      if (data.statusCode === 'S0000') {
      } else {
        alert(data.message);
      }
    },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      });
  }

  bindChargeItemsToPurchaseItem() {
    let formArr = this.caseChargeForm.get('chargeItem').get('chargeItemDetails')['controls'];
    if (formArr) {
      this.newPurchaseItems = formArr.map((payload) => {
        console.log("caseChargeForm payload= ", payload.value);
        const tempItem = {
          itemRefId: payload.value.drugId,
          subItems: null,
          cost: {
            price: payload.value.cost,
            taxIncluded: false
          },
          unitPrice: {
            price: payload.value.unitPrice.price,
            taxIncluded: payload.value.unitPrice.taxIncluded
          },
          dosage: payload.value.dose.quantity,
          purchaseUom: payload.value.dose.uom,
          duration: payload.value.duration,
          purchaseQty: payload.value.purchaseQty,
          instruct: payload.value.instruction.code,
          batchNo: payload.value.batchNumber,
          expireDate: payload.value.expiryDate,
          priceAdjustment: {
            adjustedValue: payload.value.decreaseValue,
            paymentType: payload.value.paymentType
          },
          remarks: payload.value.remark
        };
        return tempItem;
      });
    }
    this.case.salesOrder.purchaseItem = this.newPurchaseItems;
    console.log("purchaseItem = ", this.case.salesOrder.purchaseItem);
  }

  saveCase() {
    this.bindChargeItemsToPurchaseItem();
    this.apiCaseManagerService.update(this.store.getCaseId(), this.case).subscribe(data => {
      console.log('Update Case', data);
      if (data.statusCode === 'S0000') {
        alert('Case details has been updated.')
        const { payload } = data;
        this.populateData(payload);
      }
      else 
        alert(data.message);
    },
      err => {
        if (err.error)
          this.alertService.error(JSON.stringify(err.error.message));
      });
  }

  checkCheckBoxvalue(event, index) {
    console.log('checkCheckBoxvalue - ' + event, 'index - ' + index)
    if (event == "T")
      this.case.purchasedPackage.dispatches[index].utilize = true;
    else
      this.case.purchasedPackage.dispatches[index].utilize = false;
  }
}
