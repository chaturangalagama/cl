import { FormArray } from '@angular/forms';
import { MedicalCertificateItemControlComponent } from './medical-certificate-item-control.component';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-medical-certificate-items-array',
  templateUrl: './medical-certificate-items-array.component.html'
})
export class MedicalCertificateItemsArrayComponent implements OnInit {
  @Input() public itemsFormArray: FormArray;
  @Output() onDelete = new EventEmitter<number>();
  @Input() index: number;

  static buildItems() {
    return new FormArray([MedicalCertificateItemControlComponent.buildItem('', '', 0, '', '')]);
  }

  addItem() {
    this.itemsFormArray.push(MedicalCertificateItemControlComponent.buildItem('', '', 0, '', ''));
  }

  constructor() {}

  ngOnInit() {}

  onbtnDeleteClicked(index) {
    console.log('emit delete', this.index);
    this.itemsFormArray.removeAt(index);
  }
}
