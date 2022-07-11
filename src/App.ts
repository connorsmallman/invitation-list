import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestsController } from './Infrastructure/http/GuestsController';
import { AddGuest } from './UseCases/AddGuest';
import { InvitationListRepository } from './Repositories/InvitationListRepository';
import { CreateHousehold } from './UseCases/CreateHousehold';
import { HouseholdsController } from './Infrastructure/http/HousesholdController';
import { RSVP } from './UseCases/RSVP';
import { AddGuestToHousehold } from './UseCases/AddGuestToHousehold';
import { Guest } from './Infrastructure/db/entities/Guest';
import { Household } from './Infrastructure/db/entities/Household';
import { GuestAddSubscription } from './Subscriptions/GuestAddedSubscription';
import { GuestAddToHouseholdSubscription } from './Subscriptions/GuestAddToHouseholdSubscription';
import { HouseholdCreatedSubscription } from './Subscriptions/HouseholdCreatedSubscription';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Guest, Household],
      synchronize: true, //TODO remove this for production
      autoLoadEntities: true,
      logging: ['query'],
    }),
  ],
  controllers: [GuestsController, HouseholdsController],
  providers: [
    AddGuest,
    CreateHousehold,
    RSVP,
    AddGuestToHousehold,
    InvitationListRepository,
    GuestAddSubscription,
    GuestAddToHouseholdSubscription,
    HouseholdCreatedSubscription,
  ],
})
export class App {}
