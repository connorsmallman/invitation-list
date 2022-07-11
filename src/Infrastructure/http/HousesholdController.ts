import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { either as E } from 'fp-ts';
import { Response } from 'express';

import { CreateHousehold } from '../../UseCases/CreateHousehold';
import { FailedToCreateHousehold } from '../../Domain/Problems/FailedToCreateHousehold';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Household as HouseholdEntity } from '../db/entities/Household';
import { RSVP } from '../../UseCases/RSVP';
import { AddGuestToHousehold } from '../../UseCases/AddGuestToHousehold';
import { FailedToAddGuestToHousehold } from '../../Domain/Problems/FailedToAddGuestToHousehold';
import { HouseholdNotFound } from '../../Domain/Problems/HouseholdNotFound';
import { GuestNotFound } from '../../Domain/Problems/GuestNotFound';
import { FailToRSVP } from '../../Domain/Problems/FailToRSVP';
import { GuestsNotFoundInHousehold } from '../../Domain/Problems/GuestsNotFoundInHousehold';
import { HouseholdDTO } from '../../DTOs/HouseholdDTO';
import { loggerEnv } from '../../Utlities/Logger';

type GuestDTO = {
  id: string;
  name: string;
  dietaryRequirements: null | string;
  attending: boolean;
};

type RVSPToHouseholdRequestDTO = {
  householdCode: string;
  email: string;
  guests: GuestDTO[];
};

@Controller('households')
export class HouseholdsController {
  constructor(
    readonly createHouseholdUseCase: CreateHousehold,
    readonly rsvpToHouseholdUseCase: RSVP,
    readonly addGuestToHouseholdUseCase: AddGuestToHousehold,
    @InjectEntityManager() readonly entityManager: EntityManager,
  ) {}
  @Get()
  async findAll(): Promise<HouseholdDTO[]> {
    const households = await this.entityManager
      .createQueryBuilder(HouseholdEntity, 'household')
      .leftJoinAndSelect('household.guests', 'guest')
      .getMany();

    return households.map((household) => ({
      id: household.id,
      code: household.code,
      email: household.email,
      guests: household.guests.map((guest) => guest.id),
    }));
  }

  @Get(':id')
  async find(@Param('id') id: string): Promise<HouseholdDTO> {
    const household = await this.entityManager
      .createQueryBuilder(HouseholdEntity, 'household')
      .where('household.id = :id', { id })
      .getOne();

    return {
      id: household.id,
      code: household.code,
      email: household.email,
      guests: household.guests.map((guest) => guest.id),
    };
  }

  @Post()
  async createHousehold(@Res() res: Response): Promise<void> {
    const response = await this.createHouseholdUseCase.execute()(loggerEnv)();

    if (E.isLeft(response)) {
      if (response.left instanceof FailedToCreateHousehold) {
        res.status(HttpStatus.BAD_REQUEST);
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      }
      res.json({ errors: [response.left] });
    } else {
      res.sendStatus(HttpStatus.CREATED);
    }
  }

  @Put('/:householdId/guests/:guestId')
  async addGuestToHousehold(
    @Res() res: Response,
    @Param('householdId') householdId: string,
    @Param('guestId') guestId: string,
  ): Promise<void> {
    const command = {
      householdId: parseInt(householdId, 10),
      guestId,
    };

    const response = await this.addGuestToHouseholdUseCase.execute(command)(
      loggerEnv,
    )();

    if (E.isLeft(response)) {
      if (response.left instanceof FailedToAddGuestToHousehold) {
        res.status(HttpStatus.BAD_REQUEST);
      } else if (response.left instanceof HouseholdNotFound) {
        res.status(HttpStatus.NOT_FOUND);
      } else if (response.left instanceof GuestNotFound) {
        res.status(HttpStatus.NOT_FOUND);
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      }
      res.json({ errors: [response.left] });
    } else {
      res.sendStatus(HttpStatus.OK);
    }
  }

  @Put('/rsvp')
  async rsvpToHousehold(
    @Res() res: Response,
    @Body() body: RVSPToHouseholdRequestDTO,
  ): Promise<void> {
    const command = {
      householdCode: body.householdCode,
      email: body.email,
      guests: body.guests,
    };

    const response = await this.rsvpToHouseholdUseCase.execute(command)(
      loggerEnv,
    )();

    if (E.isLeft(response)) {
      if (response.left instanceof FailToRSVP) {
        res.status(HttpStatus.BAD_REQUEST);
      } else if (response.left instanceof HouseholdNotFound) {
        res.status(HttpStatus.NOT_FOUND);
      } else if (response.left instanceof GuestsNotFoundInHousehold) {
        res.status(HttpStatus.NOT_FOUND);
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      }
      res.json({ error: [response.left] });
    } else {
      res.sendStatus(HttpStatus.OK);
    }
  }
}
