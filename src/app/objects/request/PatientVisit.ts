import { AttachedMedicalCoverage } from '../AttachedMedicalCoverage';

interface PatientVisit {
  patientId: string;
  clinicId: string;
  attachedMedicalCoverages: AttachedMedicalCoverage[];
  remark: string;
  visitPurpose: VisitPurpose;
  preferredDoctorId?: string;
}

export { PatientVisit };

export interface VisitPurpose {
  name: string;
  consultationRequired: boolean;
}
