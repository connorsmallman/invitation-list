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

import { InvitationListRepository } from '../Repositories/InvitationListRepository';
import { GuestNotFound } from '../Domain/Problems/GuestNotFound';
import { HouseholdNotFound } from '../Domain/Problems/HouseholdNotFound';
import { InvitationList } from '../Domain/InvitationList';
import { FailedToAddGuestToHousehold } from '../Domain/Problems/FailedToAddGuestToHousehold';
import { HouseholdDTO } from '../DTOs/HouseholdDTO';
import { Household } from '../Domain/Household';
import { DomainEvent } from '../Domain/Events/DomainEvent';
import { logErrorP, logInfoP } from '../Utlities/ReadTaskEither';

type Command = {
  householdId: number;
  guestId: string;
};

@Injectable()
export class AddGuestToHousehold {
  constructor(
    readonly invitationListRepository: InvitationListRepository,
    readonly eventBus: EventEmitter2,
  ) {}

  execute(
    command: Command,
  ): RTE.ReaderTaskEither<
    L.LoggerEnv,
    GuestNotFound | HouseholdNotFound | FailedToAddGuestToHousehold,
    HouseholdDTO
  > {
    const getInvitationList = RTE.fromTaskEitherK(() =>
      this.invitationListRepository.find(),
    );

    const addGuestToHousehold = RTE.chain((invitationList: InvitationList) =>
      pipe(
        command,
        ({ householdId, guestId }) =>
          InvitationList.addGuestToHousehold(
            invitationList,
            householdId,
            guestId,
          ),
        RTE.fromEither,
        logInfoP('guest added to household'),
        logErrorP('guest not found'),
      ),
    );

    const save = RTE.chainFirst((invitationList: InvitationList) =>
      pipe(
        this.invitationListRepository.save(invitationList),
        RTE.fromTaskEither,
        logInfoP('invitationList saved'),
        logErrorP('invitationList not saved'),
        RTE.mapLeft(() => new FailedToAddGuestToHousehold()),
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
        invitationList.households,
        A.findFirst((h) => h.id === command.householdId),
        E.fromOption(() => new HouseholdNotFound()),
        RTE.fromEither,
        logInfoP('household mapped to DTO'),
        logErrorP('household mapping to DTO failed'),
        RTE.map(Household.toDTO),
      ),
    );

    return pipe(
      {},
      getInvitationList,
      addGuestToHousehold,
      save,
      dispatchDomainEvents,
      mapHouseholdToDTO,
    );
  }
}
