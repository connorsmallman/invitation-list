export class HouseholdNotFound extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'HOUSEHOLD_NOT_FOUND';
  }
}
