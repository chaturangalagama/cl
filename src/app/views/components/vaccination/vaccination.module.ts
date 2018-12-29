import { SharedModule } from './../../../shared.module';
import { VaccinationService } from './../../../services/vaccination.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VaccinationRoutingModule } from './vaccination-routing.module';
import { VaccinationListComponent } from './vaccination-list/vaccination-list.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { AddVaccinationComponent } from './add-vaccination/add-vaccination.component';

@NgModule({
    imports: [CommonModule, VaccinationRoutingModule, SharedModule],
    declarations: [VaccinationListComponent],
    providers: []
})
export class VaccinationModule {}
