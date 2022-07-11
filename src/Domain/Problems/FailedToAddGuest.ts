export class FailedToAddGuest extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'FAILED_TO_ADD_GUEST';
  }
}
