import { AlertService } from './../../../../services/alert.service';
import { Observable ,Subject } from 'rxjs';
import { StoreService } from './../../../../services/store.service';
import { SelectItemOptions } from './../../../../objects/SelectItemOptions';
import { Diagnosis } from './../../../../objects/response/Diagnosis';
import { ApiCmsManagementService } from './../../../../services/api-cms-management.service';
import { ConsultationFormService } from './../../../../services/consultation-form.service';
import { FormGroup, FormControl } from '@angular/forms';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { distinctUntilChanged, debounceTime, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-consultation-diagnosis-item',
  templateUrl: './consultation-diagnosis-item.component.html',
  styleUrls: ['./consultation-diagnosis-item.component.scss']
})
export class ConsultationDiagnosisItemComponent implements OnInit {
  @Input() itemGroup: FormGroup;
  @Input() index: number;
  @Output() onDelete = new EventEmitter<number>();

  codes: Array<SelectItemOptions<Diagnosis>>;
  searchTerm = new FormControl();
  diagnosisItems: Diagnosis[] = [];
  description: string;
  loading = false;

  codesTypeahead = new Subject<string>();

  constructor(
    private apiCmsManagementService: ApiCmsManagementService,
    private consultationFormService: ConsultationFormService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.onFilterInputChanged();
  }

  onFilterInputChanged() {
    try {
      this.codesTypeahead
        .pipe(
          distinctUntilChanged((a, b) => b.trim().length === 0),
          debounceTime(400),
          tap(() => (this.loading = true)),
          switchMap((term: string) => {
            return this.apiCmsManagementService.searchDiagnosis(term);
          })
        )
        .subscribe(
          data => {
            this.loading = false;
            console.log('DATA', data);

            if (data) {
              this.codes = data.payload;
            }
          },
          err => {
            this.loading = false;
            if (err && err.error && err.error.message) {
              this.alertService.error(JSON.stringify(err.error.message));
            }
          }
        );
    } catch (err) {
      console.log('Search Diagnosis Error', err);
    }
  }

  onDiagnosisSelected(option) {
    console.log('DIAGNOSIS SELECTED', option);
    if (option) {
      this.description = option.icd10Term;
    } else {
      this.description = '';
      this.onFilterInputChanged();
    }
  }
  // onDiagnosisDeselected(option) {
  //   this.description = '';
  // }

  onBtnAddClicked() {
    console.log('ADD Item');
    // this.diagnosisItems.push(new Diagnosis());
    this.consultationFormService.initDiagnosis();
  }

  onBtnDeleteClicked() {
    // clear form
    this.description = '';
    this.itemGroup.get('id').patchValue('');

    this.onDelete.emit(this.index);
  }
}
