import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MedicalCoverageRoutingModule } from './medical-coverage-routing.module';
import { AlertComponent } from '../../../directives/alert/alert.component';
import { MedicalCoverageService } from '../../../services/medical-coverage.service';

import { SharedModule } from '../../../shared.module';
// import { MedicalCoverageComponent } from './medical-coverage/medical-coverage.component';
// import { MedicalCoverageItemComponent } from './medical-coverage/medical-coverage-item/medical-coverage-item.component';
// import { MedicalCoverageItemDetailComponent } from './medical-coverage/medical-coverage-item-detail/medical-coverage-item-detail.component';

@NgModule({
  imports: [CommonModule, MedicalCoverageRoutingModule, SharedModule],
  // declarations: [
  //   MedicalCoverageComponent,
  //   MedicalCoverageItemComponent,
  //   MedicalCoverageItemDetailComponent],
  declarations: [],
  providers: [MedicalCoverageService]
})
export class MedicalCoverageModule { }
