import { AppConfigService } from './../../../services/app-config.service';
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { FileUploader } from 'ng2-file-upload';
import { PatientDetailAddDocumentComponent } from './patient-detail-add-document/patient-detail-add-document.component';
// import { API_PATIENT_VISIT_URL } from '../../../constants/app.constants';
import { StoreService } from '../../../services/store.service';
import { AlertService } from '../../../services/alert.service';
import { ApiPatientVisitService } from '../../../services/api-patient-visit.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-patient-detail-document',
  templateUrl: './patient-detail-document.component.html',
  styleUrls: ['./patient-detail-document.component.scss']
})
export class PatientDetailDocumentComponent implements OnInit {
  @Input() formGroup: FormGroup;
  bsModalRef: BsModalRef;

  uploader: FileUploader;
  hasDropZoneOver = false;

  constructor(
    private modalService: BsModalService,
    private store: StoreService,
    private alertService: AlertService,
    private apiPatientVisitService: ApiPatientVisitService,
    private appConfig:  AppConfigService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.uploader = new FileUploader({
      url: `${
        this.appConfig.getConfig().API_PATIENT_VISIT_URL
      }/document-management/upload/patient/${this.store.getPatientId()}`,
      disableMultipart: true,
      formatDataFunction: item => {
        const index = this.uploader.getIndexOfItem(item);
        const values = this.formGroup.get('newDocumentsArray').value;
        const sendable = new FormData();
        sendable.append('clinicId', this.store.getClinicId());
        sendable.append('name', '');
        sendable.append('fileName', item.file.name);
        sendable.append('description', values[index].description);
        sendable.append(item.alias, item._file, item.file.name);

        item.description = values[index].description; // Remember description for next upload dialog input
        
        return sendable;
      },
      authToken: `Bearer ${localStorage.getItem('access_token')}`
    });
    this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
      const payload = JSON.parse(response).payload;
      if (payload) {
        const index = this.uploader.getIndexOfItem(item);
        // When upload success, put the item into 'documentsArray', 
        // remove item in 'newDocumentsArray' and remove item in `uploadQueue`
        const newDocumentsArray = this.formGroup.get('newDocumentsArray') as FormArray;
        const documentsArray = this.formGroup.get('documentsArray') as FormArray;

        const uploadedDocument = this.fb.group({
          document: item.file.name,
          description: newDocumentsArray.value[index].description,
          type: item.file.type,
          size: item.file.size,
          fileId: payload.fileId,
          clinicId: payload.clinicId
        });
        documentsArray.push(uploadedDocument);
        newDocumentsArray.removeAt(index);
        this.uploader.removeFromQueue(item);
      } else {
        item.errorMsg = JSON.parse(response).message || '';
      }
    };
  }

  fileOver(event) {
    this.hasDropZoneOver = event;
  }

  openModal(event) {
    this.fileUploadModal();
  }

  fileUploadModal() {
    const initialState = {
      title: 'Uploaded Documents',
      uploader: this.uploader,
      formGroup: this.formGroup
    };

    this.modalService.show(PatientDetailAddDocumentComponent, {
      initialState,
      class: 'modal-lg'
    });
  }

  onDownloadDocument(index) {
    const files = this.formGroup.get('documentsArray').value;
    const file = files[index];
    if (file.listType === 'VISIT') {
      this.apiPatientVisitService.downloadDocument('visit', file.patientVisitId, file.fileId).subscribe(
        res => {
          saveAs(res, file.document);
        },
        err => this.alertService.error(JSON.stringify(err))
      );
    } else {
      this.apiPatientVisitService.downloadDocument('patient', this.store.getPatientId(), file.fileId).subscribe(
        res => {
          saveAs(res, file.document);
        },
        err => this.alertService.error(JSON.stringify(err))
      );
    }
  }

  onDownloadNewDocument(index) {
    const files = this.formGroup.get('newDocumentsArray').value;
    const file = files[index];
    this.apiPatientVisitService.downloadDocument('patient', this.store.getPatientId(), file.fileId).subscribe(
      res => {
        saveAs(res, file.document);
      },
      err => this.alertService.error(JSON.stringify(err))
    );
  }

  onRemoveDocumemt(index) {
    const item = this.uploader.queue[index];
    item.remove();
    const newDocumentsArray = this.formGroup.get('newDocumentsArray') as FormArray;
    newDocumentsArray.removeAt(index);
  }
}
