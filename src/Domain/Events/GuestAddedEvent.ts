import { Guest } from '../Guest';
import { DomainEvent } from './DomainEvent';

export class GuestAddedEvent implements DomainEvent {
  readonly name = 'GuestAddedEvent';
  constructor(public readonly guest: Guest) {}
}
