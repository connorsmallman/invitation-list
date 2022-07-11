export class GuestNotFound extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'GUEST_NOT_FOUND';
  }
}
