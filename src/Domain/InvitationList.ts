import Base62str from 'base62str';
import {
  either as E,
  option as O,
  array as A,
  boolean as B,
  semigroup as SG,
} from 'fp-ts';
import { Eq as eqString } from 'fp-ts/string';
import { getEq } from 'fp-ts/Array';
import { identity, increment, pipe } from 'fp-ts/function';

import { Household } from './Household';
import { Guest } from './Guest';
import { GuestNotFound } from './Problems/GuestNotFound';
import { HouseholdNotFound } from './Problems/HouseholdNotFound';
import { HouseholdCode } from './HouseholdCode';
import { GuestId } from './GuestId';
import { GuestWithThatNameAlreadyExists } from './Problems/GuestWithThatNameAlreadyExists';
import { HouseholdAlreadyExists } from './Problems/HouseholdAlreadyExists';
import { GuestsNotFoundInHousehold } from './Problems/GuestsNotFoundInHousehold';
import { HouseholdId } from './HouseholdId';
import { FailedToGetNextHouseholdId } from './Problems/FailedToGetNextHouseholdId';
import { FailedToGenerateHouseholdCode } from './Problems/FailedToGenerateHouseholdCode';
import { InvitationListDTO } from '../DTOs/InvitationListDTO';
import { HouseholdDTO } from '../DTOs/HouseholdDTO';
import { GuestDTO } from '../DTOs/GuestDTO';
import { FailedToCreateInvitationList } from './Problems/FailedToCreateinvitationList';
import { GuestAddedToHouseholdEvent } from './Events/GuestAddedToHouseholdEvent';
import { GuestAddedEvent } from './Events/GuestAddedEvent';
import { HouseholdCreatedEvent } from './Events/HouseholdCreated';
import { RSVPedEvent } from './Events/RSVPedEvent';
import { Logger } from '@nestjs/common';

const base62 = Base62str.createInstance();

type invitationListProps = {
  households?: HouseholdDTO[];
  guests?: GuestDTO[];
};

export class InvitationList {
  households: Household[];
  guests: Guest[];
  domainEvents: any[]; // TODO make abstract event class

  public static create(
    props: invitationListProps,
  ): E.Either<FailedToCreateInvitationList, InvitationList> {
    const guests = pipe(
      props.guests || [],
      A.traverse(E.Applicative)(({ id, ...props }) => Guest.create(props, id)),
      E.getOrElse((error) => {
        Logger.error(error);
        return [];
      }), //TODO better error handling
    );
    const households = pipe(
      props.households || [],
      A.traverse(E.Applicative)(Household.create),
      E.getOrElse(() => []), //TODO better error handling
    );

    return E.right({ guests, households, domainEvents: [] });
  }

  public static toDTO(invitationList: InvitationList): InvitationListDTO {
    return {
      households: invitationList.households.map(Household.toDTO),
      guests: invitationList.guests.map(Guest.toDTO),
    };
  }

  public static getNextHouseholdId(
    invitationList: InvitationList,
  ): E.Either<FailedToGetNextHouseholdId, number> {
    return E.right(pipe(invitationList.households, A.size, increment));
  }

  public static generateHouseholdCode(
    householdId: number,
  ): E.Either<FailedToGenerateHouseholdCode, string> {
    return E.right(base62.encodeStr((1000 + householdId).toString()));
  }

  public static findHouseholdByCode(
    invitationList: InvitationList,
    householdCode: HouseholdCode,
  ): E.Either<HouseholdNotFound, Household> {
    return pipe(
      invitationList.households,
      A.findFirst((h) => h.code === householdCode),
      E.fromOption(() => new HouseholdNotFound()),
    );
  }

  public static addHousehold(
    invitationList: InvitationList,
    household: Household,
  ): E.Either<HouseholdAlreadyExists, InvitationList> {
    return pipe(
      invitationList.households,
      A.findIndex((h: Household) => h.id === household.id),
      E.fromOption(() => household),
      E.swap,
      E.mapLeft(() => new HouseholdAlreadyExists()),
      E.map((h) => pipe(invitationList.households, A.append(h))),
      E.map((updatedHouseholds) => ({
        ...invitationList,
        households: updatedHouseholds,
        domainEvents: [
          ...invitationList.domainEvents,
          new HouseholdCreatedEvent(household),
        ],
      })),
    );
  }

  public static addGuestToList(
    invitationList: InvitationList,
    guest: Guest,
  ): E.Either<GuestWithThatNameAlreadyExists, InvitationList> {
    return pipe(
      invitationList.guests,
      A.exists((g: Guest) => g.name === guest.name),
      O.fromPredicate((s) => {
        return !s;
      }),
      E.fromOption(() => {
        return new GuestWithThatNameAlreadyExists();
      }),
      E.map(() => pipe(invitationList.guests, A.append(guest))),
      E.map((updatedGuests) => ({
        ...invitationList,
        guests: updatedGuests,
        domainEvents: [
          ...invitationList.domainEvents,
          new GuestAddedEvent(guest),
        ],
      })),
    );
  }

  public static addGuestToHousehold(
    invitationList: InvitationList,
    householdId: number,
    guestId: GuestId,
  ): E.Either<GuestNotFound | HouseholdNotFound, InvitationList> {
    return pipe(
      E.Do,
      // Bind invitationList to invitationList
      E.bind('invitationList', () => E.of(invitationList)),
      // Bind guest or return GuestNotFound Error
      E.bind('guest', () =>
        pipe(
          invitationList.guests,
          A.findFirst((g: Guest) => g.id === guestId),
          E.fromOption(() => new GuestNotFound()),
        ),
      ),
      // Bind household or return HouseholdNotFound Error
      E.bind('household', () =>
        pipe(
          invitationList.households,
          A.findFirst((h: Household) => h.id === householdId),
          E.fromOption(() => new HouseholdNotFound()),
        ),
      ),
      // Return invitationList with updated households, guests and domainEvents
      E.map(({ invitationList, guest, household }) => {
        const updatedGuest = {
          ...guest,
          household: O.of(household.id),
        };
        const updatedHousehold = {
          ...household,
          guests: pipe(household.guests, A.append(updatedGuest.id)),
        };

        return {
          ...invitationList,
          households: pipe(
            invitationList.households,
            A.findIndex((h) => h.id === household.id),
            O.map((i) =>
              pipe(invitationList.households, A.updateAt(i, updatedHousehold)),
            ),
            O.flatten,
            O.fold(() => invitationList.households, identity),
          ),
          guests: pipe(
            invitationList.guests,
            A.findIndex((g) => g.id === guest.id),
            O.map((i) =>
              pipe(invitationList.guests, A.updateAt(i, updatedGuest)),
            ),
            O.flatten,
            O.fold(() => invitationList.guests, identity),
          ),
          domainEvents: [
            ...invitationList.domainEvents,
            new GuestAddedToHouseholdEvent(guestId, householdId),
          ],
        };
      }),
    );
  }

  public static rsvp(
    invitationList: InvitationList,
    householdCode: HouseholdCode,
    email: string,
    guests: Guest[],
  ): E.Either<HouseholdNotFound | GuestsNotFoundInHousehold, InvitationList> {
    const Eq = getEq(eqString);
    return pipe(
      invitationList.households,
      // Find household or return error
      A.findFirst((h) => h.code === householdCode),
      E.fromOption(() => new HouseholdNotFound()),
      // Check guests are in the household
      E.chainFirst((household) =>
        pipe(
          Eq.equals(
            household.guests,
            guests.map((g) => g.id),
          ),
          B.fold(
            () => E.left(new GuestsNotFoundInHousehold()),
            () => E.right(household),
          ),
        ),
      ),
      E.map(() => {
        const semigroupGuest: SG.Semigroup<Guest> = SG.struct({
          id: SG.first<string>(),
          name: SG.last<string>(),
          dietaryRequirements: O.getMonoid<string>(SG.last()),
          attending: O.getMonoid<boolean>(SG.last()),
          isChild: SG.last<boolean>(),
          household: O.getMonoid<HouseholdId>(SG.last()),
        });

        return {
          ...invitationList,
          households: pipe(
            invitationList.households,
            A.map((household) => {
              if (household.code === householdCode) {
                return {
                  ...household,
                  email: O.fromNullable(email),
                };
              }
              return household;
            }),
          ),
          guests: pipe(
            invitationList.guests,
            A.map((guest) =>
              pipe(
                guests,
                A.findFirst((update) => update.id === guest.id),
                O.fold(
                  () => guest,
                  (update) => semigroupGuest.concat(guest, update),
                ),
              ),
            ),
          ),
          domainEvents: [
            ...invitationList.domainEvents,
            new RSVPedEvent(householdCode),
          ],
        };
      }),
    );
  }
}
