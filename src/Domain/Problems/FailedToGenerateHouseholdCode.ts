export class FailedToGenerateHouseholdCode extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'FAILED_TO_GENERATE_HOUSEHOLD_CODE';
  }
}
