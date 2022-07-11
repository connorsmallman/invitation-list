export class FailedToCreateInvitationList extends Error {
  readonly code: string;
  constructor(message: string) {
    super();
    this.code = 'FAILED_TO_CREATE_INVITATION_LIST';
    this.message = message;
    this.name = 'FailedToCreateInvitationList';
  }
}
