import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';

import { PatientSearchComponent } from './patient-search/patient-search.component';
import { PatientUpdateComponent } from './patient-update/patient-update.component';
import { PatientAddComponent } from './patient-add/patient-add.component';
import { PatientDetailComponent } from './patient-detail/patient-detail.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientDetailLayoutComponent } from '../../../containers/patient-detail-layout';

export const redirectTo = () => {
  alert('Please check you have corresponding permission or not.');
  return 'login';
};

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [NgxPermissionsGuard],
    data: {
      title: 'Patient'
    },
    component: PatientDetailLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'list' },
      {
        path: 'add',
        component: PatientAddComponent,
        data: {
          requiresLogin: true,
          permissions: {
            only: ['ROLE_PATIENT_REGISTRATION'],
            redirectTo
          }
        }
      },
      {
        path: 'detail',
        component: PatientDetailComponent,
        data: {
          requiresLogin: true,
          permissions: {
            only: ['ROLE_PATIENT_ACCESS'],
            redirectTo
          }
        }
      },
      {
        path: 'detail/:id',
        component: PatientDetailComponent,
        data: {
          requiresLogin: true,
          permissions: {
            only: ['ROLE_PATIENT_ACCESS'],
            redirectTo
          }
        }
      },
      {
        path: 'update',
        component: PatientUpdateComponent,
        data: {
          requiresLogin: true,
          permissions: {
            only: ['ROLE_PATIENT_REGISTRATION'],
            redirectTo
          }
        }
      },
      {
        path: 'list',
        component: PatientListComponent,
        data: {
          requiresLogin: true,
          permissions: {
            only: ['ROLE_PATIENT_ACCESS'],
            redirectTo
          }
        }
      },
      {
        path: 'update/:type/:value',
        component: PatientUpdateComponent,
        data: {
          requiresLogin: true,
          permissions: {
            only: ['ROLE_PATIENT_REGISTRATION'],
            redirectTo
          }
        }
      },
      {
        path: 'search',
        component: PatientSearchComponent,
        data: {
          requiresLogin: true,
          permissions: {
            only: ['ROLE_PATIENT_ACCESS'],
            redirectTo
          }
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientRoutingModule {}
