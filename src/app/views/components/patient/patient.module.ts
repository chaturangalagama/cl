import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

import { DynamicFormComponent } from '../../../components/dynamic-form/dynamic-form.component';
import { PatientDetailComponentsModule } from '../../../components/patient-detail/patient-detail-components.module';
import { PatientDetailLayoutComponent } from '../../../containers/patient-detail-layout';
import { DynamicFormContainerComponent } from './../../../components/dynamic-form-container/dynamic-form-container.component';
import { PatientAddComponentsModule } from './../../../components/patient-add/patient-add-components.module';
import { FormService } from './../../../services/form.service';
import { PatientUpdateFormService } from './../../../services/patient-update-form.service';
import { SharedModule } from './../../../shared.module';
import { PatientAddComponent } from './patient-add/patient-add.component';
import { PatientDetailComponent } from './patient-detail/patient-detail.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientRoutingModule } from './patient-routing.module';
import { PatientSearchComponent } from './patient-search/patient-search.component';
import { PatientUpdateComponent } from './patient-update/patient-update.component';

@NgModule({
  imports: [
    CommonModule,
    PatientRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BsDatepickerModule.forRoot(),
    SharedModule,
    PatientDetailComponentsModule,
    PatientAddComponentsModule
  ],
  declarations: [
    PatientDetailLayoutComponent,
    PatientListComponent,
    PatientAddComponent,
    PatientDetailComponent,
    PatientUpdateComponent,
    PatientSearchComponent,
    DynamicFormComponent,
    DynamicFormContainerComponent
  ],

  providers: [FormService, PatientUpdateFormService]
})
export class PatientModule {}
