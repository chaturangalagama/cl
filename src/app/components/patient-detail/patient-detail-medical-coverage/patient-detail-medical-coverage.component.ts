import { MEDICAL_COVERAGES } from './../../../constants/app.constants';
import {
	AssignMedicalCoverageComponent,
	SelectedItem
} from '../../../views/components/medical-coverage/assign-medical-coverage/assign-medical-coverage.component';
import { Component, OnInit, Input, EventEmitter, ElementRef } from '@angular/core';
import { FormBuilder, FormArray } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { StoreService } from '../../../services/store.service';

@Component({
	selector: 'app-patient-detail-medical-coverage',
	templateUrl: './patient-detail-medical-coverage.component.html',
	styleUrls: ['./patient-detail-medical-coverage.component.scss']
})
export class PatientDetailMedicalCoverageComponent implements OnInit {
	@Input() itemArray: FormArray;
	public event: EventEmitter<any> = new EventEmitter();
	selectedItems: SelectedItem[];

	isAllEmployeeNoEntered = false;
	medicalCoverages = MEDICAL_COVERAGES;

	// Medical Coverage Modal
	bsModalRef: BsModalRef;
	plans = [];

	constructor(
		private fb: FormBuilder,
		private modalService: BsModalService,
		private eRef: ElementRef,
		private store: StoreService
	) {}

	ngOnInit() {
		this.subscribeChange();
	}

	subscribeChange() {
		this.itemArray.valueChanges.pipe(debounceTime(50)).subscribe(data => {
			console.log('new med data__', data);
			if (data.patientCoverageId !== '') {
				this.plans = [];
				data.forEach(element => {
					if (element.medicalCoverageId) {
						console.log('Data Data', this.store.getPlan(element.medicalCoverageId, element.planId));
						const plan = this.store.getPlan(element.medicalCoverageId, element.planId);
						plan['patientCoverageId'] = element.patientCoverageId;
						// plan['coveragePlan'] = plan.coveragePlans[0];
						this.plans.push(plan);
					}
				});
			}
		});
	}

	addMedicalCoverage(event) {
		const initialState = {
			title: 'Medical Coverage',
			itemArray: this.itemArray,
			data: this.plans
		};
		this.bsModalRef = this.modalService.show(AssignMedicalCoverageComponent, { initialState, class: 'modal-lg' });
		if (this.selectedItems) {
			this.bsModalRef.content.setSelectedItems(this.selectedItems);
		}

		this.bsModalRef.content.event.subscribe(data => {
			if (data) {
				this.selectedItems = data;
				this.bsModalRef.content.event.unsubscribe();
				this.bsModalRef.hide();

				console.log('aaaathis.selectedItems', this.selectedItems);
			}
		});
	}

	onShowExtraClicked(index) {
		let i: number;
		for (i = 0; i < this.selectedItems.length; i++) {
			this.selectedItems[i].showExtra = i === index;
		}
		const ref = this.eRef.nativeElement.querySelector('popoverbtn' + index);
		if (ref) {
			ref.hide();
		}
	}

	onBtnDeleteClicked(index) {
		this.selectedItems.slice(index, 1);
	}

	onBtnAddClicked() {
		this.selectedItems.push(new SelectedItem());
		this.onShowExtraClicked(this.selectedItems.length - 1);
		this.isAllEmployeeNoEntered = false;
	}

	onEmployeeIdChanged() {
		this.isAllEmployeeNoEntered = true;
		this.selectedItems.map((value, index) => {
			if (!value.employeeNo || value.employeeNo.trim().length === 0) {
				this.isAllEmployeeNoEntered = false;
				return;
			}
		});
	}
}
