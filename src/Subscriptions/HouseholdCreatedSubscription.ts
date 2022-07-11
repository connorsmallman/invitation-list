import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { HouseholdCreatedEvent } from '../Domain/Events/HouseholdCreated';
import { Household } from '../Domain/Household';

@Injectable()
export class HouseholdCreatedSubscription {
  @OnEvent(HouseholdCreatedEvent.name)
  onHouseholdCreate(payload: HouseholdCreatedEvent) {
    Logger.log(
      JSON.stringify(Household.toDTO(payload.household)),
      'HouseholdCreated',
    );
  }
}
