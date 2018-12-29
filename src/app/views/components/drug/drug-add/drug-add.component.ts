import { DrugPrice } from './../../../../objects/Drug';
import { AlertService } from './../../../../services/alert.service';
import { DrugService } from './../../../../services/drug.service';
import { Component, OnInit } from '@angular/core';
import { Drug } from '../../../../objects/Drug';

@Component({
    selector: 'app-drug-add',
    templateUrl: './drug-add.component.html',
    styleUrls: ['./drug-add.component.scss']
})
export class DrugAddComponent implements OnInit {
    // DATA MODEL
    drugCode: string;
    drugName: string;
    uom: string;
    price: number;
    chargeCode: string;
    taxIncluded = false;

    constructor(
        private drugService: DrugService,
        private alertService: AlertService
    ) {}

    ngOnInit() {}

    onAddDrugSubmit() {
        const price: DrugPrice = {
            price: this.price,
            chargeCode: this.chargeCode,
            taxIncluded: this.taxIncluded
        };

        const drug: Drug = {
            code: this.chargeCode,
            name: this.drugName,
            uom: this.uom,
            price: price
        };
        this.drugService.add(drug).subscribe(
            res => {
                console.log('RES ', res);
                // this.userService.setToken()
                // this.router.navigate(['page/main']);
            },
            err => {
                this.alertService.error(err.error.message);
                console.log('Error occured', err.error.message);

                console.log(err.headers.get('Content-Type'));
            }
        );

        console.log('DRUG', drug);
    }
}
