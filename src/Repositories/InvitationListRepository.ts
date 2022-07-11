import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { taskEither as TE, array as A, either as E } from 'fp-ts';

import { EntityManager } from 'typeorm';
import { InvitationList } from '../Domain/InvitationList';
import { pipe } from 'fp-ts/function';
import { Guest as GuestEntity } from '../Infrastructure/db/entities/Guest';
import { Household as HouseholdEntity } from '../Infrastructure/db/entities/Household';
import { Guest } from '../Domain/Guest';
import { Household } from '../Domain/Household';

@Injectable()
export class InvitationListRepository {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  find(): TE.TaskEither<Error, InvitationList> {
    const mapHouseholdsToDTO = (households: HouseholdEntity[]) =>
      pipe(
        households,
        A.map((h) => ({ ...h, guests: h.guests.map((g) => g.id) })),
      );

    const mapGuestsToDTO = (guests: GuestEntity[]) =>
      pipe(
        guests,
        A.map((g) => ({ ...g, household: g.household?.id })),
      );

    const getGuests = TE.tryCatchK(
      () =>
        this.entityManager
          .createQueryBuilder(GuestEntity, 'guest')
          .leftJoinAndSelect('guest.household', 'household')
          .getMany(),
      (error: Error) => new Error(`Failed to get guests: ${error.message}`),
    );

    const getHouseholds = TE.tryCatchK(
      () =>
        this.entityManager
          .createQueryBuilder(HouseholdEntity, 'household')
          .leftJoinAndSelect('household.guests', 'guest')
          .getMany(),
      (error: Error) => new Error(`Failed to get households: ${error.message}`),
    );

    return pipe(
      TE.Do,
      TE.bind('guests', getGuests),
      TE.bind('households', getHouseholds),
      TE.map(({ guests, households }) => ({
        guests: mapGuestsToDTO(guests),
        households: mapHouseholdsToDTO(households),
      })),
      TE.chain(({ guests, households }) =>
        pipe(InvitationList.create({ guests, households }), TE.fromEither),
      ),
      TE.mapLeft(
        (error: Error) =>
          new Error(`Failed to find guest list: ${error.message}`),
      ),
    );
  }

  save(invitationList: InvitationList): TE.TaskEither<Error, void> {
    const saveGuests = TE.tryCatchK(
      (guests) => {
        return this.entityManager.save(guests);
      },
      (error: Error) => new Error(`Failed to save guests: ${error.message}`),
    );

    const saveHouseholds = TE.tryCatchK(
      (households) => {
        return this.entityManager.save(households);
      },
      (error: Error) =>
        new Error(`Failed to save households: ${error.message}`),
    );

    const mapHouseholdsToEntities = (households: Household[]) =>
      pipe(
        households,
        A.traverse(E.Applicative)((h: Household) =>
          E.tryCatch(
            () => Household.toPersistence(h),
            (error: Error) =>
              new Error(
                `Failed to convert household to entity: ${error.message}`,
              ),
          ),
        ),
        E.map(A.map((h) => this.entityManager.create(HouseholdEntity, h))),
      );

    const mapGuestsToEntities = (guests: Guest[]) =>
      pipe(
        guests,
        A.traverse(E.Applicative)((g: Guest) =>
          E.tryCatch(
            () => Guest.toPersistence(g),
            (error: Error) =>
              new Error(`Failed to convert guest to entity: ${error.message}`),
          ),
        ),
        E.map(A.map((g) => this.entityManager.create(GuestEntity, g))),
      );

    return pipe(
      invitationList.households,
      mapHouseholdsToEntities,
      TE.fromEither,
      TE.chain(saveHouseholds),
      TE.chainFirst(() =>
        pipe(
          invitationList.guests,
          mapGuestsToEntities,
          TE.fromEither,
          TE.chain(saveGuests),
        ),
      ),
      TE.mapLeft((error) => {
        Logger.error(error);
        return new Error(`Failed to save invitation list: ${error.message}`);
      }),
      TE.map(() => undefined),
    );
  }
}
