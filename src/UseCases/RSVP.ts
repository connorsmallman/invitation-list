import { pipe } from 'fp-ts/function';
import {
  readerTaskEither as RTE,
  array as A,
  either as E,
  io as IO,
} from 'fp-ts';
import * as L from 'logger-fp-ts';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { InvitationList } from '../Domain/InvitationList';
import { InvitationListRepository } from '../Repositories/InvitationListRepository';
import { Guest } from '../Domain/Guest';
import { HouseholdNotFound } from '../Domain/Problems/HouseholdNotFound';
import { GuestsNotFoundInHousehold } from '../Domain/Problems/GuestsNotFoundInHousehold';
import { FailToRSVP } from '../Domain/Problems/FailToRSVP';
import { HouseholdDTO } from '../DTOs/HouseholdDTO';
import { Household } from '../Domain/Household';
import { FailedToCreateGuest } from '../Domain/Problems/FailedtoCreateGuest';
import { DomainEvent } from '../Domain/Events/DomainEvent';
import { logErrorP, logInfoP } from '../Utlities/ReadTaskEither';

type GuestCommand = {
  id: string;
  name: string;
  dietaryRequirements: string;
  attending: boolean;
};

type Command = {
  householdCode: string;
  email: string;
  guests: GuestCommand[];
};

@Injectable()
export class RSVP {
  constructor(
    readonly invitationListRepository: InvitationListRepository,
    readonly eventBus: EventEmitter2,
  ) {}

  execute(
    command: Command,
  ): RTE.ReaderTaskEither<
    L.LoggerEnv,
    | HouseholdNotFound
    | GuestsNotFoundInHousehold
    | FailToRSVP
    | FailedToCreateGuest,
    HouseholdDTO
  > {
    const getInvitationList = RTE.bind('invitationList', () =>
      pipe(
        this.invitationListRepository.find(),
        RTE.fromTaskEither,
        logInfoP('invitationList found'),
        logErrorP('invitationList not found'),
        RTE.mapLeft(() => new FailToRSVP()),
      ),
    );

    const createGuests = RTE.bind('guests', () =>
      pipe(
        command.guests,
        A.traverse(E.Applicative)((g) =>
          Guest.create(
            {
              name: g.name,
              dietaryRequirements: g.dietaryRequirements,
              attending: g.attending,
            },
            g.id,
          ),
        ),
        RTE.fromEither,
        logInfoP('guests created'),
        logErrorP('guests not created'),
        RTE.mapLeft(() => new FailedToCreateGuest('')),
      ),
    );

    const rsvp = RTE.chain(({ invitationList, guests }) =>
      pipe(
        InvitationList.rsvp(
          invitationList,
          command.householdCode,
          command.email,
          guests,
        ),
        RTE.fromEither,
        logInfoP('rsvp successful'),
        logErrorP('rsvp not successful'),
      ),
    );

    const save = RTE.chainFirst((invitationList: InvitationList) =>
      pipe(
        invitationList,
        () => this.invitationListRepository.save(invitationList),
        RTE.fromTaskEither,
        logInfoP('invitationList saved'),
        logErrorP('invitationList not saved'),
      ),
    );

    const dispatchDomainEvents = RTE.chainFirstIOK(
      (invitationList: InvitationList) =>
        pipe(
          invitationList.domainEvents,
          A.map((event: DomainEvent) => this.eventBus.emit(event.name, event)),
          IO.of,
        ),
    );

    const mapHouseholdToDTO = RTE.chain((invitationList: InvitationList) =>
      pipe(
        InvitationList.findHouseholdByCode(
          invitationList,
          command.householdCode,
        ),
        E.map(Household.toDTO),
        RTE.fromEither,
        logInfoP('household mapped to DTO'),
        logErrorP('household not mapped to DTO'),
      ),
    );

    return pipe(
      RTE.Do,
      getInvitationList,
      createGuests,
      rsvp,
      save,
      dispatchDomainEvents,
      mapHouseholdToDTO,
    );
  }
}
