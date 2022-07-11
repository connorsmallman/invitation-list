export class GuestWithThatNameAlreadyExists extends Error {
  readonly code: string;
  constructor() {
    super();
    this.code = 'GUEST_WITH_THAT_NAME_ALREADY_EXISTS';
  }
}
