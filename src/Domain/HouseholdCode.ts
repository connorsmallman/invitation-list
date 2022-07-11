import * as t from 'io-ts';

export const HouseholdCodeC = t.string;

export type HouseholdCode = t.TypeOf<typeof HouseholdCodeC>;
