import { HouseholdCode } from '../HouseholdCode';
import { DomainEvent } from './DomainEvent';

export class RSVPedEvent implements DomainEvent {
  readonly name = 'RSVPedEvent';
  constructor(public readonly householdCode: HouseholdCode) {}
}
