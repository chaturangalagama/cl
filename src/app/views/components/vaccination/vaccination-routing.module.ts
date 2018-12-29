import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';

import { AddVaccinationComponent } from './../vaccination/add-vaccination/add-vaccination.component';
import { VaccinationListComponent } from './vaccination-list/vaccination-list.component';

const routes: Routes = [
    {
        path: '',
        canActivate: [NgxPermissionsGuard],
        data: {
            title: 'Vaccination',
            permissions: {
                only: [
                    "ROLE_VACCINATION",
                ],
            },
        },
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'search' },
            {
                path: 'search',
                component: VaccinationListComponent
            },
            {
                path: 'add',
                component: AddVaccinationComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VaccinationRoutingModule { }
