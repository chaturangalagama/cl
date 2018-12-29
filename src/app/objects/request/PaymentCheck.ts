export default class PaymentCheck {
  itemId?: string;
  excludedCoveragePlanIds?: Array<string>;

  constructor(itemId?: string, excludedCoveragePlanIds?: Array<string>) {
    this.itemId = itemId || '';
    this.excludedCoveragePlanIds = excludedCoveragePlanIds ? excludedCoveragePlanIds : [];
  }
}
