import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { GuestAddedToHouseholdEvent } from '../Domain/Events/GuestAddedToHouseholdEvent';

@Injectable()
export class GuestAddToHouseholdSubscription {
  @OnEvent(GuestAddedToHouseholdEvent.name)
  onGuestAddedToHousehold(payload: GuestAddedToHouseholdEvent) {
    Logger.log(
      `guest: ${payload.guestId} household: ${payload.householdId}`,
      'GuestAddedToHousehold',
    );
  }
}
