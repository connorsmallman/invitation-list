import * as t from 'io-ts';
import { either as E, option as O } from 'fp-ts';
import { pipe } from 'fp-ts/function';

import { FailedToCreateHousehold } from './Problems/FailedToCreateHousehold';
import { HouseholdCodeC } from './HouseholdCode';
import { HouseholdDTO } from '../DTOs/HouseholdDTO';
import { Household as HouseholdEntity } from '../Infrastructure/db/entities/Household';
import { Guest as GuestEntity } from '../Infrastructure/db/entities/Guest';
import { GuestId } from './GuestId';
import { Logger } from '@nestjs/common';

type HouseholdProps = {
  id: number;
  code: string;
  email?: string;
  guests?: GuestId[];
};

export const HouseholdC = t.type({
  id: t.number,
  code: HouseholdCodeC,
  email: t.string,
  guests: t.array(t.string),
});

export class Household {
  id: number;
  code: string;
  email: O.Option<string>;
  guests: GuestId[];

  public static create(
    props: HouseholdProps,
  ): E.Either<FailedToCreateHousehold, Household> {
    return pipe(
      HouseholdC.decode({
        ...props,
        email: props.email || '',
        guests: props.guests || [],
      }),
      E.fold(
        (reason) => {
          Logger.error(JSON.stringify(reason));
          return E.left(new FailedToCreateHousehold());
        },
        (value) =>
          E.right({
            id: value.id,
            code: value.code,
            guests: value.guests,
            email: O.fromNullable(value.email),
          }),
      ),
    );
  }

  public static toPersistence(household: Household): HouseholdEntity {
    return {
      id: household.id,
      code: household.code,
      email: pipe(
        household.email,
        O.getOrElse(() => null),
      ),
      guests: household.guests.map((id) => {
        const entity = new GuestEntity();
        entity.id = id;
        return entity;
      }),
    };
  }

  public static toDTO(household: Household): HouseholdDTO {
    return {
      id: household.id,
      code: household.code,
      email: pipe(
        household.email,
        O.getOrElse(() => null),
      ),
      guests: household.guests.map((g) => g),
    };
  }
}
