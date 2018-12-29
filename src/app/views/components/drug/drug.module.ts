import { DrugRemoveComponent } from './drug-remove/drug-remove.component';
import { FormsModule } from '@angular/forms';
import { DrugAddComponent } from './drug-add/drug-add.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DrugRoutingModule } from './drug-routing.module';
import { DrugListComponent } from './drug-list/drug-list.component';
import { DrugUpdateComponent } from './drug-update/drug-update.component';
import { SharedModule } from '../../../shared.module';

@NgModule({
    imports: [CommonModule, DrugRoutingModule, FormsModule, SharedModule],
    declarations: [
        DrugListComponent,
        DrugAddComponent,
        DrugUpdateComponent,
        DrugRemoveComponent
    ],
    providers: []
})
export class DrugModule {}
