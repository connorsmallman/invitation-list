export class InvalidRSVP extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'INVALID_RSVP';
  }
}
