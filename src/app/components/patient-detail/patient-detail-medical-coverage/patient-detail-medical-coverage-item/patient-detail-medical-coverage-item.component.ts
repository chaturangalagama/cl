import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-patient-detail-medical-coverage-item',
  templateUrl: './patient-detail-medical-coverage-item.component.html',
  styleUrls: ['./patient-detail-medical-coverage-item.component.scss']
})
export class PatientDetailMedicalCoverageItemComponent implements OnInit {
  @Input() item;

  constructor() {}

  ngOnInit() {}
}
