import { Component, OnInit, Input } from '@angular/core';
import { StoreService } from './../../../services/store.service';
import { ApiPatientInfoService } from './../../../services/api-patient-info.service';
import { ApiPatientVisitService } from './../../../services/api-patient-visit.service';
import { AlertService } from './../../../services/alert.service';

@Component({
  selector: 'app-payment-follow-up',
  templateUrl: './payment-follow-up.component.html',
  styleUrls: ['./payment-follow-up.component.scss']
})
export class PaymentFollowUpComponent implements OnInit {
  @Input() consultationInfo;
  @Input() followUpFormGroup;
  minDate: Date;

  constructor(
    private apiPatientVisitService: ApiPatientVisitService,
    private store: StoreService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.minDate = new Date();

    console.log('followupformgroup: ', this.followUpFormGroup);
    
  }

  subscribeValueChanges() {}
}
