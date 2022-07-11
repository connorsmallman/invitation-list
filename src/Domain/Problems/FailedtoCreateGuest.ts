export class FailedToCreateGuest extends Error {
  readonly code: string;
  constructor(message: string) {
    super();
    this.code = 'FAILED_TO_CREATE_GUEST';
    this.message = message;
    this.name = 'FailedToCreateGuest';
  }
}
