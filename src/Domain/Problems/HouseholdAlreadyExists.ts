export class HouseholdAlreadyExists extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'HOUSEHOLD_ALREADY_EXISTS';
  }
}
