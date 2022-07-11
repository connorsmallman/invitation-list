import * as t from 'io-ts';

export const HouseholdIdC = t.number;

export type HouseholdId = t.TypeOf<typeof HouseholdIdC>;
