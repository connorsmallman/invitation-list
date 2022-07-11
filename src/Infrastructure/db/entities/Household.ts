import { Column, Entity, OneToMany, PrimaryColumn, JoinTable } from 'typeorm';
import { Guest } from './Guest';

@Entity()
export class Household {
  @PrimaryColumn()
  id: number;

  @Column({ nullable: true })
  email: string;

  @Column()
  code: string;

  @OneToMany(() => Guest, (guest) => guest.household)
  guests: Guest[];
}
