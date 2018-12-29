import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray } from '@angular/forms';

@Component({
  selector: 'app-payment-coverage-limit',
  templateUrl: './payment-coverage-limit.component.html',
  styleUrls: ['./payment-coverage-limit.component.scss']
})
export class PaymentCoverageLimitComponent implements OnInit {
  @Input() coverageLimitFormGroup: FormGroup;

  constructor() {}

  ngOnInit() {}
}
