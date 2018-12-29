
import {map,  distinctUntilChanged, debounceTime, switchMap, tap, filter } from 'rxjs/operators';
import { DrugInputSearchModalComponent } from './../../../shared/drug-input-search-modal/drug-input-search-modal.component';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { mulitplierValidator } from './../../../../services/consultation-form.service';
import { LoggerService } from './../../../../services/logger.service';
import { ApiPatientInfoService } from './../../../../services/api-patient-info.service';
import { AlertService } from './../../../../services/alert.service';
import { TopDrugDescription } from './../../../../objects/DrugDescription';
import { StoreService } from './../../../../services/store.service';
import { ApiPatientVisitService } from './../../../../services/api-patient-visit.service';
import { ApiCmsManagementService } from './../../../../services/api-cms-management.service';
import { MaxDiscountClass } from './../../../../objects/response/MaxDiscount';
import { SelectItemOptions } from './../../../../objects/SelectItemOptions';

import { DrugItem, Instruction, DosageInstruction } from './../../../../objects/DrugItem';
import { UtilsService } from '../../../../services/utils.service';
import { BsModalService } from 'ngx-bootstrap';
import { DISPLAY_DATE_FORMAT, INPUT_DELAY } from '../../../../constants/app.constants';
import PaymentCheck from '../../../../objects/request/PaymentCheck';
import { Uom } from '../../../../objects/Uom';

import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-prescription-item',
  templateUrl: './prescription-item.component.html',
  styleUrls: ['./prescription-item.component.scss']
})
export class PrescriptionItemComponent implements OnInit {
  @Input() prescriptionItem: FormGroup;
  @Input() index: number;
  @Output() onDelete = new EventEmitter<number>();
  @Output() onTopDrugDescriptionChanged = new EventEmitter<TopDrugDescription>();

  bsModalRef: BsModalRef;

  errors = [];

  isDiscountShown = false;
  loading = false;

  minimumDispenseAmount: number;
  drugDuration: number;
  drugDose: number;
  totalPrice: string;
  price: number;
  plan: string;

  dosageLabel: string;

  maxDiscount: MaxDiscountClass;

  originalDrugList = [];
  drugs = [];
  // Updated Instruction and Dosage Instruction
  instructions: Array<Instruction>;
  dosageInstructions: Array<DosageInstruction>;
  dosageInstruction: FormControl;
  currentDosageInstruction: string;
  plans = [];

  dosageMin: number = 1;

  topDrugDescription: TopDrugDescription;

  codesTypeahead = new Subject<string>();

  constructor(
    private apiCmsManagementService: ApiCmsManagementService,
    private apiPatientVisitService: ApiPatientVisitService,
    private apiPatientInfoService: ApiPatientInfoService,
    private store: StoreService,
    private utils: UtilsService,
    private alertService: AlertService,
    private logger: LoggerService,
    private modalService: BsModalService,
    private fb: FormBuilder
  ) {
    this.drugs = new Array<SelectItemOptions<DrugItem>>();
    this.instructions = this.store.getInstructions();
    this.dosageInstructions = this.store.getDosageInstructions();
    this.dosageInstruction = new FormControl();
  }

  ngOnInit() {
    this.dosageLabel = 'TAB';
    this.topDrugDescription = { charge: '', cautionary: '', sig: '', remarks: '' };

    this.drugs = this.store.drugList;
    this.originalDrugList = this.store.drugList;

    this.subscribeChange();

    this.maxDiscount = new MaxDiscountClass();

    this.onFilterInputChanged();
  }

  subscribeChange() {
    // Main Form Changes for Copy Prescription
    this.prescriptionItem.valueChanges
      .pipe(debounceTime(INPUT_DELAY), distinctUntilChanged((a, b) => {
        return a.drugId === b.drugId;
      }))
      .subscribe(data => {
        console.log('new Form Group inserted', data);
        const drugData = data.drugId;
        if (drugData) {
          this.populateInstruction(this.store.findDrugById(drugData));
          this.checkDrugPlan(drugData);
          this.updateDrugToTopDescription(drugData);
          // this.updateDosageInstructionToTopDescription(data.dosageInstruction ? data.dosageInstruction.instruct : '');
        }
        this.updateInstructionToTopDescription(data.instruction);
        //this.plan = JSON.stringify(data.attachedMedicalCoverages);
      });

    // Instrcution Changes
    this.prescriptionItem
      .get('instruction')
      .get('code')
      .valueChanges
      .pipe(debounceTime(INPUT_DELAY))
      .subscribe(data => {
        this.updateInstructionToTopDescription(this.prescriptionItem.get('instruction').value);
      });

    // Quantity Changes
    this.prescriptionItem
      .get('quantity')
      .valueChanges
      .pipe(debounceTime(INPUT_DELAY), distinctUntilChanged((a, b) => {
        return a === b;
      }))
      .subscribe(data => {
        console.log('quantity', data, this.prescriptionItem);
        this.calculateTotalPrice(data, this.price);
        this.updateInventories();
        // update top panel info
        this.topDrugDescription.qty = data;
      });

    // Dosage Instruction Quantity Changes
    this.prescriptionItem
      .get('dose')
      .get('quantity')
      .valueChanges
      .pipe(debounceTime(INPUT_DELAY), distinctUntilChanged())
      .subscribe(value => {
        this.patchDosageInstruction();
      });

    // Dosage Instruction Changes
    this.prescriptionItem
      .get('dosageInstruction')
      .get('code')
      .valueChanges
      .pipe(debounceTime(INPUT_DELAY), distinctUntilChanged())
      .subscribe(value => {
        this.updateDosageInstructionToTopDescription(
          this.prescriptionItem.get('dosageInstruction').get('instruct').value
        );
        if (
          this.prescriptionItem
            .get('dosageInstruction')
            .get('instruct')
            .value.includes('#')
        ) {
          this.setDosageValidators();
          this.patchDosageInstruction();
        } else {
          this.prescriptionItem
            .get('dose')
            .get('quantity')
            .setValidators(null);
          this.prescriptionItem
            .get('dose')
            .get('quantity')
            .markAsTouched();
          this.prescriptionItem
            .get('dose')
            .get('quantity')
            .updateValueAndValidity();
        }
      });

    // Duration Changes
    this.prescriptionItem
      .get('duration')
      .valueChanges
      .pipe(debounceTime(INPUT_DELAY))
      .subscribe(data => {
        console.log('duration', data);
        this.drugDuration = data;
        // this.patchQuantity();
      });

    // convert correct date format
    this.prescriptionItem
      .get('expiryDate')
      .valueChanges.pipe(
      map(d => {
        d = moment(d, DISPLAY_DATE_FORMAT).format(DISPLAY_DATE_FORMAT);
        const isValid = moment(d, DISPLAY_DATE_FORMAT).isValid();
        return isValid ? d : '';
      }))
      .subscribe(data => {
        this.prescriptionItem.get('expiryDate').patchValue(data, { emitEvent: false });
      });

    // Remark Changes
    this.prescriptionItem
      .get('remark')
      .valueChanges
      .pipe(debounceTime(INPUT_DELAY), distinctUntilChanged())
      .subscribe(value => {
        this.updateRemarkToTopDescription(value);
      });
  }

  /** ng-select change detection */
  onDrugSelect(option: DrugItem) {
    console.log('DRUG OPTION', option);
    if (option) {
      this.apiPatientInfoService.checkAllergies(this.store.getPatientId(), [option.id]).subscribe(
        res => {
          this.logger.info('Drug Allergy', res);
          if (res.payload) {
            const drugAllergies: Array<string> = res.payload;
            // assume only checking for 1 drug
            if (drugAllergies[0] === option.id) {
              this.errors = [];
              this.errors.push('This patient is allergic to this medicine.');
            } else {
              this.errors = [];
            }
          }
        },
        err => {
          this.alertService.error(JSON.stringify(err.error['message']));
        }
      );
      // fields reset
      this.resetFields(option);

      this.minimumDispenseAmount = option.minimumDispenseAmount;

      this.prescriptionItem
        .get('dose')
        .get('uom')
        .patchValue(option.uom);

      this.prescriptionItem
        .get('dose')
        .get('quantity')
        .patchValue(option.recommendedDose);

      console.log('CAUTIONARY', option.cautionary);

      this.updateCautionaryToTopDescription(option.cautionary);

      // Check Plan
      // this.checkDrugPlan(option.id);

      this.populateDosageInstruction(option);

      this.populateInstruction(option);

      this.updateDiscount(option.priceAdjustment);

      this.prescriptionItem.get('quantity').patchValue(option.standardDispenseAmount);

      this.totalPrice = '';

      // set mandatory fields
      this.setMandatoryFields(option);

      this.updateInventories();
    } else {
      this.onFilterInputChanged();
    }
  }

  onDosageInstructionSelect(option) {
    if (option) {
      console.log('Dosage Instruction', option);
      // this variable to store the original instruction and to be used in case replacement is needed
      this.currentDosageInstruction = option.instruct;
      const dosageInstruct = this.prescriptionItem.get('dosageInstruction').get('instruct');

      dosageInstruct.patchValue(option.instruct);
    }
  }

  onInstructionSelect(option) {
    this.prescriptionItem.get('instruction').patchValue(option);
    console.log('instruction option', option);

    this.updateInstructionToTopDescription(option);
  }
  /** ng-select change detection */

  resetFields(option: any) {
    this.prescriptionItem.get('drugId').patchValue(option.id);
    this.prescriptionItem.get('expiryDate').patchValue(this.utils.getDBDateOnly(''));
    this.prescriptionItem
      .get('instruction')
      .get('code')
      .patchValue('');
    this.prescriptionItem
      .get('instruction')
      .get('instruct')
      .patchValue('');
    this.prescriptionItem.get('duration').patchValue('');
    this.prescriptionItem
      .get('dosageInstruction')
      .get('code')
      .patchValue('');
    this.prescriptionItem
      .get('dosageInstruction')
      .get('instruct')
      .patchValue('');
    // Inventory values reset
    this.prescriptionItem.patchValue({
      batchNumber: '',
      expiryDate: '',
      stock: 9999
    });
  }

  checkDrugPlan(drugsId: string) {
    const drugItems = new PaymentCheck(drugsId);

    this.apiPatientVisitService.paymentCheckDrug(this.store.getPatientVisitRegistryId(), [drugItems]).subscribe(
      data => {
        // this.populatePlan(drugsId[0], data);
        const qty = this.prescriptionItem.get('quantity').value;
        const itemPrice = data.payload.find(element => {
          return element['itemId'] === drugsId;
        });
        if (itemPrice) {
          const price = itemPrice.charge.price;
          this.price = price.toFixed(2);
          this.calculateTotalPrice(qty, price);
        }
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );
  }

  patchQuantity() {
    // const dose = this.prescriptionItem.get('dose').get('quantity');
    // const frequency = this.prescriptionItem.get('instruction').get('frequencyPerDay');
    // console.log('_3 PARAMS', frequency.value, dose.value, this.drugDuration);
    // if (frequency.value && (dose.value && +dose.value > 0) && (this.drugDuration && this.drugDuration > 0)) {
    //   console.log('3 PARAMS', frequency.value, dose.value, this.drugDuration);
    //   const qty = frequency.value * +dose.value * this.drugDuration;
    //   this.prescriptionItem.get('quantity').patchValue(qty);
    // }
    console.log('presctiptionItem', this.prescriptionItem);
  }

  populateDosageInstruction(data) {
    if (data.dosageInstruction) {
      this.currentDosageInstruction = data.dosageInstruction.instruct;
      this.prescriptionItem.get('dosageInstruction').patchValue(data.dosageInstruction);
    } else {
      this.currentDosageInstruction = '';
      this.prescriptionItem
        .get('dosageInstruction')
        .get('code')
        .patchValue('');
      this.prescriptionItem
        .get('dosageInstruction')
        .get('instruct')
        .patchValue('');
    }
  }

  populateInstruction(data) {
    console.log('instruction option', data);

    if (data.instruction) {
      this.prescriptionItem.get('instruction').patchValue(data.instruction);
    }
  }

  calculateTotalPrice(qty, price) {
    if (qty && qty > 0 && (price && price > 0)) {
      console.log('TOTAL PRICE', qty, price);
      this.totalPrice = this.utils.round(qty * price * 1.07, 2).toFixed(2);
    }
  }

  /** DISCOUNT */
  toggleDiscount() {
    this.isDiscountShown = !this.isDiscountShown;
  }

  updateDiscount(maxDiscount: MaxDiscountClass) {
    console.log('Price Adjusment', maxDiscount);
    this.prescriptionItem
      .get('priceAdjustment')
      .get('paymentType')
      .patchValue(maxDiscount.paymentType);

    this.maxDiscount = maxDiscount;
  }
  /** DISCOUNT */

  patchDosageInstruction() {
    if (
      this.prescriptionItem
        .get('dosageInstruction')
        .get('instruct')
        .value.includes('#')
    ) {
      const instruct = this.prescriptionItem.get('dosageInstruction').get('instruct').value
        ? this.prescriptionItem
            .get('dosageInstruction')
            .get('instruct')
            .value.replace('#', this.prescriptionItem.get('dose').get('quantity').value)
        : this.currentDosageInstruction;
      this.updateDosageInstructionToTopDescription(instruct);
    }
  }

  /** TOP DESCRIPTION */
  updateTopDescription() {
    console.log('emit touch');
    this.onTopDrugDescriptionChanged.emit(this.topDrugDescription);
  }

  updateDrugToTopDescription(id) {
    const drug_ = this.store.findDrugById(id);

    this.topDrugDescription.charge = `${drug_.name}`;
    this.topDrugDescription.uom = `${drug_.uom}`;

    this.updateTopDescription();
  }

  updateDosageInstructionToTopDescription(dosageInstruction) {
    console.log('DOSAGE INSTS', dosageInstruction);
    if (dosageInstruction) {
      this.topDrugDescription.dosageInstruction = dosageInstruction + '/';
    } else {
      this.topDrugDescription.dosageInstruction = '';
    }

    this.updateTopDescription();
  }

  updateInstructionToTopDescription(data) {
    this.topDrugDescription.sig = data.instruct;
    // this.topDrugDescription.cautionary = data.cautionary;

    this.updateTopDescription();
  }

  updateCautionaryToTopDescription(cautionary: Array<string>) {
    let tempCautionary = '';
    console.log('CAUTIONARY', cautionary);
    cautionary.forEach(element => {
      tempCautionary += element + ', ';
      (<FormArray>this.prescriptionItem.get('cautionary')).push(this.fb.control(element));
    });
    console.log('CAUTIONARY', tempCautionary);
    this.topDrugDescription.cautionary = tempCautionary;

    this.updateTopDescription();
  }

  updateRemarkToTopDescription(remark) {
    this.topDrugDescription.remarks = remark;

    this.updateTopDescription();
  }
  /** TOP DESCRIPTION */

  deletePressed() {
    console.log('emit delete', this.index);
    this.onDelete.emit(this.index);
  }

  onSearchDrug() {
    const initialState = {
      list: {},
      title: 'Drug Search'
    };
    this.bsModalRef = this.modalService.show(DrugInputSearchModalComponent, { initialState, class: 'modal-lg' });
    this.bsModalRef.content.closeBtnName = 'X';

    this.bsModalRef.content.event.subscribe(data => {
      if (data) {
        console.log('POP UP RETURNED DATA', data);
        this.onDrugSelect(data[0]);
      }
    });
  }

  onFilterInputChanged() {
    try {
      this.codesTypeahead
        .pipe(
          filter(input => {
            if (input.trim().length === 0) {
              this.logger.info('input is 0');
              this.drugs = this.store.drugList;
              return false;
            } else {
              return true;
            }
          }),
          distinctUntilChanged((a, b) => {
            this.logger.info('input is 1');
            return a === b;
          }),
          tap(() => (this.loading = true)),
          debounceTime(200),
          switchMap((term: string) => {
            return this.apiCmsManagementService.searchDrugs(term);
          })
        )
        .subscribe(
          data => {
            this.loading = false;
            console.log('DATA', data);

            if (data) {
              this.drugs = data.payload;
            }
          },
          err => {
            this.loading = false;
            this.alertService.error(JSON.stringify(err.error.message));
          }
        );
    } catch (err) {
      console.log('Search Diagnosis Error', err);
    }
  }

  setMandatoryFields(drugItem: DrugItem) {
    console.log('set mandatory');
    this.prescriptionItem
      .get('instruction')
      .get('code')
      .setValidators([Validators.required]);
    this.prescriptionItem
      .get('instruction')
      .get('code')
      .markAsTouched();
    this.prescriptionItem
      .get('instruction')
      .get('code')
      .updateValueAndValidity();
    this.prescriptionItem.get('quantity').setValidators([Validators.required, Validators.min(1)]);
    this.prescriptionItem.get('quantity').markAsTouched();
    this.prescriptionItem.get('quantity').updateValueAndValidity();

    this.setDosageValidators();

    this.prescriptionItem
      .get('expiryDate')
      .setValidators([Validators.required, Validators.pattern('((0[1-9]|[12]\\d|3[01])-(0[1-9]|1[0-2])-\\d{4})')]);
    this.prescriptionItem.get('expiryDate').markAsTouched();
    this.prescriptionItem.get('expiryDate').updateValueAndValidity();
  }

  setDosageValidators() {

    const uomInput =  this.prescriptionItem
    .get('dose')
    .get('uom')
    .value.toLocaleLowerCase()

    const uom: Uom = this.store.uoms.find(item => item.uom.toLowerCase() === uomInput) || new Uom();
    this.dosageMin = uom.multiply;

    this.prescriptionItem
      .get('dose')
      .get('quantity')
      .setValidators([
        Validators.required,
        Validators.min(this.dosageMin),
        mulitplierValidator(this.dosageMin)
      ]);
    this.prescriptionItem
      .get('dose')
      .get('quantity')
      .markAsTouched();
    this.prescriptionItem
      .get('dose')
      .get('quantity')
      .updateValueAndValidity();
  }

  updateInventories() {
    console.log('**** updateInventories ****');

    const drugId = this.prescriptionItem.get('drugId').value;
    const quantity = this.prescriptionItem.get('quantity').value;

    const drugUsage = {
      inventoryType: 'DRUG',
      itemId: drugId,
      quantity: quantity
    };
    this.apiPatientVisitService.getInventory(this.store.getClinicId(), [drugUsage]).subscribe(
      res => {
        const inventories = res.payload;
        const inventory = inventories.find(iv => iv.itemId === drugId);

        const batchNo = inventory.batchNo ? inventory.batchNo : '';
        const stock = inventory.remainingQuantity ? inventory.remainingQuantity : 9999;
        const isDateValid = moment(inventory.expiryDate, DISPLAY_DATE_FORMAT).isValid();
        const expiryDate = isDateValid
          ? moment(inventory.expiryDate, 'YYYY-MM-DD').format(DISPLAY_DATE_FORMAT)
          : moment(new Date()).format(DISPLAY_DATE_FORMAT);

        // Inventory Invalid msg will be shown if any field is mising
        const inventoryInvalid = batchNo && expiryDate && stock ? '' : 'The inventory data may not be correct.';
        this.prescriptionItem.patchValue({
          batchNumber: batchNo || '',
          expiryDate: expiryDate || moment(new Date()).format(DISPLAY_DATE_FORMAT),
          stock,
          inventoryInvalid
        });
      },
      err => {
        this.prescriptionItem.patchValue({
          batchNumber: '',
          expiryDate: moment(new Date()).format(DISPLAY_DATE_FORMAT),
          stock: 9999,
          inventoryInvalid: 'The item is not available in the inventory.'
        });
      }
    );
  }
}
