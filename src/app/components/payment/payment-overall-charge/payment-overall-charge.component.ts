import { UtilsService } from './../../../services/utils.service';
import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';

@Component({
  selector: 'app-payment-overall-charge',
  templateUrl: './payment-overall-charge.component.html',
  styleUrls: ['./payment-overall-charge.component.scss']
})
export class PaymentOverallChargeComponent implements OnInit {
  @Input() overallChargeFormGroup: FormGroup;
  overallCharges;
  totalCharge = 0;
  totalGst = 0;
  totalCash = 0;
  totalCashGst = 0;

  constructor(private utilService: UtilsService) { }

  ngOnInit() {
    this.overallCharges = this.overallChargeFormGroup.get('overallCharges').value.value;
    this.overallChargeFormGroup.get('overallCharges').valueChanges.subscribe(values => {
      this.overallCharges = values.value;
    });
  }

  formatToTitleCase(string) {
    return this.utilService.convertToTitleCaseUsingSpace(string);
  }
}
