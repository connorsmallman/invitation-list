import { GuestId } from '../GuestId';
import { HouseholdId } from '../HouseholdId';
import { DomainEvent } from './DomainEvent';

export class GuestAddedToHouseholdEvent implements DomainEvent {
  name = 'GuestAddedToHouseholdEvent';
  constructor(readonly guestId: GuestId, readonly householdId: HouseholdId) {}
}
