export class FailedToGetNextHouseholdId extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'FAILED_TO_GET_NEXT_HOUSEHOLD_ID';
  }
}
