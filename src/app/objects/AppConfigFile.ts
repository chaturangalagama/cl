export class AppConfigFile {
  API_URL: string;
  API_DOMAIN: string;
  API_AA_URL: string;
  API_PATIENT_VISIT_URL: string;
  API_INVENTORY_SYSTEM_URL: string;
  API_PATIENT_INFO_URL: string;
  API_CASE_INFO_URL: string;
  API_CMS_MANAGEMENT_URL: string;
  API_PACKAGE_ITEM_INFO_URL: string;
  REPORT_URL: string;
  SHOW_COPY_PRESCRIPTION_AFTER: string;

  constructor(
    API_URL?: string,
    API_DOMAIN?: string,
    API_AA_URL?: string,
    API_PATIENT_VISIT_URL?: string,
    API_INVENTORY_SYSTEM_URL?: string,
    API_PATIENT_INFO_URL?: string,
    API_CASE_INFO_URL?: string,
    API_CMS_MANAGEMENT_URL?: string,
    API_PACKAGE_ITEM_INFO_URL?: string,
    REPORT_URL?: string,
    SHOW_COPY_PRESCRIPTION_AFTER?: string
  ) {
    this.API_URL = API_URL || '';
    this.API_DOMAIN = API_DOMAIN || '';
    this.API_AA_URL = API_AA_URL || '';
    this.API_PATIENT_VISIT_URL = API_PATIENT_VISIT_URL || '';
    this.API_INVENTORY_SYSTEM_URL = API_INVENTORY_SYSTEM_URL || '';
    this.API_PATIENT_INFO_URL = API_PATIENT_INFO_URL || '';
    this.API_CASE_INFO_URL = API_CASE_INFO_URL || '';
    this.API_CMS_MANAGEMENT_URL = API_CMS_MANAGEMENT_URL || '';
    this.API_PACKAGE_ITEM_INFO_URL = API_PACKAGE_ITEM_INFO_URL || '';
    this.REPORT_URL = REPORT_URL || '';
    this.SHOW_COPY_PRESCRIPTION_AFTER = SHOW_COPY_PRESCRIPTION_AFTER || '';
  }
}
