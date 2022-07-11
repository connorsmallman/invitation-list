import { HouseholdDTO } from './HouseholdDTO';
import { GuestDTO } from './GuestDTO';

export class InvitationListDTO {
  households: HouseholdDTO[];
  guests: GuestDTO[];
}
