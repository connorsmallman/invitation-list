import { Injectable } from '@nestjs/common';
import { readerTaskEither as RTE, io as IO, array as A } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import * as L from 'logger-fp-ts';

import { Guest } from '../Domain/Guest';
import { InvitationListRepository } from '../Repositories/InvitationListRepository';
import { InvitationList } from '../Domain/InvitationList';
import { GuestWithThatNameAlreadyExists } from '../Domain/Problems/GuestWithThatNameAlreadyExists';
import { FailedToAddGuest } from '../Domain/Problems/FailedToAddGuest';
import { FailedToCreateGuest } from '../Domain/Problems/FailedtoCreateGuest';
import { GuestDTO } from '../DTOs/GuestDTO';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../Domain/Events/DomainEvent';
import { logErrorP, logInfoP } from '../Utlities/ReadTaskEither';

type Command = {
  id?: string;
  name: string;
  dietaryRequirements?: string;
  attending?: null | boolean;
  isChild?: boolean;
};

@Injectable()
export class AddGuest {
  constructor(
    readonly invitationListRepository: InvitationListRepository,
    private eventBus: EventEmitter2,
  ) {}

  execute(
    command: Command,
  ): RTE.ReaderTaskEither<
    L.LoggerEnv,
    FailedToAddGuest | FailedToCreateGuest | GuestWithThatNameAlreadyExists,
    GuestDTO
  > {
    const createGuest = RTE.bind('guest', () =>
      pipe(
        Guest.create({ name: command.name }, command.id),
        RTE.fromEither,
        logInfoP('guest created'),
        logErrorP('guest not created'),
        RTE.mapLeft(() => new FailedToAddGuest()),
      ),
    );

    const getInvitationList = RTE.bind('invitationList', () =>
      pipe(
        this.invitationListRepository.find(),
        RTE.fromTaskEither,
        logInfoP('invitationList found'),
        logErrorP('invitationList not found'),
        RTE.mapLeft(() => new FailedToAddGuest()),
      ),
    );

    const addGuest = RTE.chain(({ guest, invitationList }) =>
      pipe(
        InvitationList.addGuestToList(invitationList, guest),
        RTE.fromEither,
        logInfoP('guest added to list'),
        logErrorP('guest not added to list'),
        RTE.map((invitationList) => ({ guest, invitationList })),
        RTE.mapLeft(() => new FailedToAddGuest()),
      ),
    );

    const save = RTE.chainFirst(({ invitationList }) =>
      pipe(
        this.invitationListRepository.save(invitationList),
        RTE.fromTaskEither,
        logInfoP('invitationList saved'),
        logErrorP('invitationList not saved'),
        RTE.mapLeft(() => new FailedToAddGuest()),
      ),
    );

    const dispatchDomainEvents = RTE.chainFirstIOK(({ invitationList }) =>
      pipe(
        invitationList.domainEvents,
        A.map((event: DomainEvent) => this.eventBus.emit(event.name, event)),
        IO.of,
      ),
    );

    const mapGuestToDTO = RTE.map(({ guest }) => Guest.toDTO(guest));

    return pipe(
      RTE.Do,
      createGuest,
      getInvitationList,
      addGuest,
      save,
      dispatchDomainEvents,
      mapGuestToDTO,
    );
  }
}
