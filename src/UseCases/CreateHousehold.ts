import { Injectable } from '@nestjs/common';
import { pipe } from 'fp-ts/function';
import { io as IO, array as A, readerTaskEither as RTE } from 'fp-ts';
import * as L from 'logger-fp-ts';

import { InvitationListRepository } from '../Repositories/InvitationListRepository';
import { Household } from '../Domain/Household';
import { InvitationList } from '../Domain/InvitationList';
import { FailedToCreateHousehold } from '../Domain/Problems/FailedToCreateHousehold';
import { HouseholdDTO } from '../DTOs/HouseholdDTO';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../Domain/Events/DomainEvent';
import { logErrorP, logInfoP } from '../Utlities/ReadTaskEither';

@Injectable()
export class CreateHousehold {
  constructor(
    readonly invitationListRepository: InvitationListRepository,
    readonly eventBus: EventEmitter2,
  ) {}
  execute(): RTE.ReaderTaskEither<
    L.LoggerEnv,
    FailedToCreateHousehold,
    HouseholdDTO
  > {
    const getInvitationList = RTE.bind('invitationList', () =>
      pipe(
        this.invitationListRepository.find(),
        RTE.fromTaskEither,
        logInfoP('invitationList found'),
        logErrorP('invitationList not found'),
        RTE.mapLeft(() => new FailedToCreateHousehold()),
      ),
    );

    const getNextHouseholdId = RTE.bind('id', ({ invitationList }) =>
      pipe(
        //TODO: Don't generate ids like this in production
        InvitationList.getNextHouseholdId(invitationList),
        RTE.fromEither,
        logInfoP('next household id found'),
        logErrorP('next household id not found'),
        RTE.mapLeft(() => new FailedToCreateHousehold()),
      ),
    );

    const generateHouseholdCodeFromId = RTE.bind('code', ({ id }) =>
      pipe(
        InvitationList.generateHouseholdCode(id),
        RTE.fromEither,
        logInfoP('household code generated'),
        logErrorP('household code not generated'),
        RTE.mapLeft(() => new FailedToCreateHousehold()),
      ),
    );

    const createHousehold = RTE.bind('household', ({ id, code }) =>
      pipe(
        Household.create({ id, code }),
        RTE.fromEither,
        logInfoP('household created'),
        logErrorP('household not created'),
        RTE.mapLeft(() => new FailedToCreateHousehold()),
      ),
    );

    const addHouseholdToInvitationList = RTE.chain(
      ({ invitationList, household }) =>
        pipe(
          InvitationList.addHousehold(invitationList, household),
          RTE.fromEither,
          logInfoP('household added to invitation list'),
          logErrorP('household not added to invitation list'),
          RTE.map((updatedInvitationList) => ({
            invitationList: updatedInvitationList,
            household,
          })),
          RTE.mapLeft(() => new FailedToCreateHousehold()),
        ),
    );

    const save = RTE.chainFirst(({ invitationList }) =>
      pipe(
        this.invitationListRepository.save(invitationList),
        RTE.fromTaskEither,
        logInfoP('invitation list saved'),
        logErrorP('invitation list not saved'),
        RTE.mapLeft(() => new FailedToCreateHousehold()),
      ),
    );

    const dispatchDomainEvents = RTE.chainFirstIOK(({ invitationList }) =>
      pipe(
        invitationList.domainEvents,
        A.map((event: DomainEvent) => this.eventBus.emit(event.name, event)),
        IO.of,
      ),
    );

    const mapHouseholdToDTO = RTE.map(({ household }) =>
      Household.toDTO(household),
    );

    return pipe(
      RTE.Do,
      getInvitationList,
      getNextHouseholdId,
      generateHouseholdCodeFromId,
      createHousehold,
      addHouseholdToInvitationList,
      save,
      dispatchDomainEvents,
      mapHouseholdToDTO,
    );
  }
}
