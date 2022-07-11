export class FailedToAddGuestToHousehold extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'FAILED_TO_ADD_GUEST_TO_HOUSEHOLD';
  }
}
