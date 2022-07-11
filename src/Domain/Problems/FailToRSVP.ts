export class FailToRSVP extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'FAIL_TO_RSVP';
  }
}
