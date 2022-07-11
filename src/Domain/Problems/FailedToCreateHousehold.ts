export class FailedToCreateHousehold extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'FAILED_TO_CREATE_HOUSEHOLD';
  }
}
