import { Component, OnInit, Input, EventEmitter } from '@angular/core';
import { StoreService } from '../../../services/store.service';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'app-case-manager-delete-payment',
  templateUrl: './case-manager-delete-payment.component.html',
  styleUrls: ['./case-manager-delete-payment.component.scss']
})
export class CaseManagerDeletePaymentComponent implements OnInit {

  rows = [];
  fromDate: string;
  startDate: Date;
  patientId: string;
  selected = [];
  visitIds = [];
  public event: EventEmitter<any> = new EventEmitter();

  columns = [
    { name: 'Mode', flexGrow: 1 },
    { name: 'Amount', flexGrow: 1 },
    { name: 'Date/Time', flexGrow: 1 },
    { name: 'Reference', flexGrow: 1 }
  ];
  visitResponse: any;

  constructor(
    private store: StoreService,
    private alertService: AlertService,
    private authService: AuthService,
    private router: Router,
    private bsModalRef: BsModalRef,
  ) { }

  ngOnInit() {
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

    if (this.store.errorMessages.length > 0) {
      this.store.errorMessages.forEach(errorMsg1 => {
        console.log('ERROR MESSAGE: ', errorMsg1);
      });
    }
  }

  cancelModal() {
    this.bsModalRef.hide();
  }

  onDeletePaymentConfirm(textInput){
    console.log(textInput);
    this.event.emit({textInput: textInput});
  }
}
