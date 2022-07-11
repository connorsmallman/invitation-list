export class GuestsNotFoundInHousehold extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'GUESTS_NOT_FOUND_IN_HOUSEHOLD';
  }
}
