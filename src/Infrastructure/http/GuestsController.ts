import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { either as E } from 'fp-ts';
import { Response } from 'express';

import { AddGuest } from '../../UseCases/AddGuest';
import { Guest as GuestEntity } from '../../Infrastructure/db/entities/Guest';
import { GuestWithThatNameAlreadyExists } from '../../Domain/Problems/GuestWithThatNameAlreadyExists';
import { FailedToAddGuest } from '../../Domain/Problems/FailedToAddGuest';
import { FailedToCreateGuest } from '../../Domain/Problems/FailedtoCreateGuest';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { GuestId } from '../../Domain/GuestId';
import { loggerEnv } from '../../Utlities/Logger';

type GuestResponseDTO = {
  id: string;
  name: string;
  email?: string;
  dietaryRequirements: null | string;
  attending: null | boolean;
  isChild: boolean;
  household: null | number;
};

type GuestsResponseDTO = GuestResponseDTO[];

type AddGuestRequestDTO = {
  name: string;
  email?: string;
  dietaryRequirements?: string;
  attending?: boolean;
  isChild?: boolean;
};

@Controller('guests')
export class GuestsController {
  constructor(
    readonly addGuestUseCase: AddGuest,
    @InjectEntityManager() readonly entityManager: EntityManager,
  ) {}

  @Get()
  async findAll(): Promise<GuestsResponseDTO> {
    const guests = await this.entityManager
      .createQueryBuilder(GuestEntity, 'guest')
      .leftJoinAndSelect('guest.household', 'household')
      .getMany();

    return guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      dietaryRequirements: guest.dietaryRequirements,
      attending: guest.attending,
      isChild: guest.isChild,
      household: guest.household?.id,
    }));
  }

  @Get(':id')
  async find(@Param('id') id: GuestId): Promise<GuestResponseDTO> {
    const guest = await this.entityManager
      .createQueryBuilder(GuestEntity, 'guest')
      .where('guest.id = :id', { id })
      .leftJoinAndSelect('guest.household', 'household')
      .getOne();

    return {
      id: guest.id,
      name: guest.name,
      dietaryRequirements: guest.dietaryRequirements,
      attending: guest.attending,
      isChild: guest.isChild,
      household: guest.household?.id,
    };
  }

  @Post()
  async addGuest(
    @Res() res: Response,
    @Body() addGuestDTO: AddGuestRequestDTO,
  ): Promise<void> {
    const guest = {
      name: addGuestDTO.name,
      email: addGuestDTO.email,
      dietaryRequirements: addGuestDTO.dietaryRequirements,
      attending: addGuestDTO.attending,
      isChild: addGuestDTO.isChild,
    };

    const response = await this.addGuestUseCase.execute(guest)(loggerEnv)();

    if (E.isLeft(response)) {
      if (response.left instanceof GuestWithThatNameAlreadyExists) {
        res.status(HttpStatus.CONFLICT);
      } else if (response.left instanceof FailedToAddGuest) {
        res.status(HttpStatus.BAD_REQUEST);
      } else if (response.left instanceof FailedToCreateGuest) {
        res.status(HttpStatus.BAD_REQUEST);
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      }
      res.json({ errors: [response.left] });
    } else {
      res.sendStatus(HttpStatus.CREATED);
    }
  }
}
