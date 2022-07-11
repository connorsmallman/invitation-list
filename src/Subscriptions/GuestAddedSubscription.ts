import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { GuestAddedEvent } from '../Domain/Events/GuestAddedEvent';
import { Guest } from '../Domain/Guest';

@Injectable()
export class GuestAddSubscription {
  @OnEvent(GuestAddedEvent.name)
  onGuestAdded(payload: GuestAddedEvent) {
    Logger.log(JSON.stringify(Guest.toDTO(payload.guest)), 'GuestAdded');
  }
}
