import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';

import { DrugUpdateComponent } from './drug-update/drug-update.component';
import { DrugListComponent } from './drug-list/drug-list.component';
import { DrugAddComponent } from './drug-add/drug-add.component';

const routes: Routes = [
    {
        path: '',
        canActivate: [NgxPermissionsGuard],
        data: {
            title: 'Drug',
            permissions: {
                only: [
                    "ROLE_DRUG_CONTROLLER",
                ],
            },
        },
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'search' },
            {
                path: 'add',
                component: DrugAddComponent
            },
            {
                path: 'update',
                component: DrugUpdateComponent
            },
            {
                path: 'search',
                component: DrugListComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DrugRoutingModule { }
