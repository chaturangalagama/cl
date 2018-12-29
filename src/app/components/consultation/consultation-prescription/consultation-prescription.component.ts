import { ConsultationFormService } from './../../../services/consultation-form.service';
import { FormArray } from '@angular/forms';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TopDrugDescription } from '../../../objects/DrugDescription';

@Component({
  selector: 'app-consultation-prescription',
  templateUrl: './consultation-prescription.component.html',
  styleUrls: ['./consultation-prescription.component.scss']
})
export class ConsultationPrescriptionComponent implements OnInit {
  @Input() public itemsFormArray: FormArray;
  @Input() index: number;

  topDrugDescription: TopDrugDescription;

  constructor(private consultationFormService: ConsultationFormService) {}

  ngOnInit() {
    console.log('Pres_Array', this.itemsFormArray.controls);
    this.topDrugDescription = { charge: '', cautionary: '', sig: '', remarks: '' };
  }

  addItem() {
    console.log('ADD Item');
    // this.consultationFormService.initDrugDispatchDetails();
    this.consultationFormService.addMultipleDrugDispatch(3);
  }

  onTopDrugDescriptionUpdated(event: TopDrugDescription) {
    console.log('touched event', event);
    this.topDrugDescription = event;
  }

  onDelete(index) {
    console.log('delete index', index);
    this.itemsFormArray.removeAt(index);
  }
}
