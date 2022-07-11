import { Entity, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { Household } from './Household';

@Entity()
export class Guest {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  dietaryRequirements: string;

  @Column({ nullable: true })
  attending: boolean;

  @Column({ default: false })
  isChild: boolean;

  @ManyToOne(() => Household, (household) => household.guests)
  household: Household;
}
