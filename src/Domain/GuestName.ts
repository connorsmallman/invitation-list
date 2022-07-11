import * as t from 'io-ts';

export type GuestName = string;

export interface GuestNameBrand {
  readonly GuestName: unique symbol; // use `unique symbol` here to ensure uniqueness across modules / packages
}

export const GuestNameC = t.brand(
  t.string, // a codec representing the type to be refined
  (s): s is t.Branded<string, GuestNameBrand> => s.length > 2 && s.length < 100, // a custom type guard using the build-in helper `Branded`
  'GuestName', // the name must match the readonly field in the brand
);
