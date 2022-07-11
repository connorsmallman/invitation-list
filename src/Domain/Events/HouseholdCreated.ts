import { Household } from '../Household';
import { DomainEvent } from './DomainEvent';

export class HouseholdCreatedEvent implements DomainEvent {
  readonly name = 'HouseholdCreatedEvent';
  constructor(readonly household: Household) {}
}
