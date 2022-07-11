import { taskEither as TE, either as E } from 'fp-ts';
import { randEmail, randFullName, randUuid } from '@ngneat/falso';

import { InvitationListRepository } from '../Repositories/InvitationListRepository';
import { InvitationList } from '../Domain/InvitationList';
import { AddGuestToHousehold } from './AddGuestToHousehold';
import { GuestNotFound } from '../Domain/Problems/GuestNotFound';
import { HouseholdNotFound } from '../Domain/Problems/HouseholdNotFound';
import { FailedToAddGuestToHousehold } from '../Domain/Problems/FailedToAddGuestToHousehold';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { loggerEnv } from '../Utlities/Logger';

describe('add guest to household', () => {
  test('should add guest to household', async () => {
    const findMock = jest.fn();
    const saveMock = jest.fn();
    const InvitationListRepositoryMock = <jest.Mock<InvitationListRepository>>(
      (<unknown>jest.fn(() => ({
        find: findMock,
        save: saveMock,
      })))
    );

    const guestName = randFullName();
    const guestId = randUuid();

    const guest = {
      name: guestName,
      id: guestId,
      dietaryRequirements: '',
      isChild: false,
      attending: null,
      household: 1,
    };

    const household = {
      id: 1,
      code: 'code',
      email: randEmail(),
      guests: [guest.id],
    };
    const invitationListMock = InvitationList.create({
      guests: [guest],
      households: [household],
    });
    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.of(null));

    const useCase = new AddGuestToHousehold(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );
    const response = await useCase.execute({
      guestId: guest.id,
      householdId: household.id,
    })(loggerEnv)();

    expect(response).toEqual(
      E.right({
        ...household,
        guests: [...household.guests, guest.id],
      }),
    );
  });

  test('should fail if guest not found', async () => {
    const findMock = jest.fn();
    const saveMock = jest.fn();
    const InvitationListRepositoryMock = <jest.Mock<InvitationListRepository>>(
      (<unknown>jest.fn(() => ({
        find: findMock,
        save: saveMock,
      })))
    );
    const invitationListMock = InvitationList.create({});
    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.of(null));

    const guestId = randUuid();

    const useCase = new AddGuestToHousehold(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );

    const response = await useCase.execute({
      guestId,
      householdId: 1,
    })(loggerEnv)();

    expect(response).toEqual(E.left(new GuestNotFound()));
  });

  test('should fail if household not found', async () => {
    const findMock = jest.fn();
    const saveMock = jest.fn();
    const InvitationListRepository = <jest.Mock<InvitationListRepository>>(
      (<unknown>jest.fn(() => ({
        find: findMock,
        save: saveMock,
      })))
    );

    const guestName = randFullName();
    const guestId = randUuid();

    const guest = {
      name: guestName,
      id: guestId,
      dietaryRequirements: '',
      isChild: false,
      attending: null,
      household: 1,
    };

    const household = {
      id: 1,
      code: 'code',
      email: randEmail(),
      guests: [guest.id],
    };

    const invitationListMock = InvitationList.create({
      guests: [guest],
      households: [household],
    });
    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.of(null));

    const useCase = new AddGuestToHousehold(
      new InvitationListRepository(),
      new EventEmitter2(),
    );

    const response = await useCase.execute({
      guestId: guest.id,
      householdId: 2,
    })(loggerEnv)();

    expect(response).toEqual(E.left(new HouseholdNotFound()));
  });

  test('should fail if save fails', async () => {
    const findMock = jest.fn();
    const saveMock = jest.fn();
    const InvitationListRepositoryMock = <jest.Mock<InvitationListRepository>>(
      (<unknown>jest.fn(() => ({
        find: findMock,
        save: saveMock,
      })))
    );

    const guestName = randFullName();
    const guestId = randUuid();

    const guest = {
      name: guestName,
      id: guestId,
      dietaryRequirements: '',
      isChild: false,
      attending: null,
      household: 1,
    };

    const household = {
      id: 1,
      code: 'code',
      email: randEmail(),
      guests: [guest.id],
    };

    const invitationListMock = InvitationList.create({
      guests: [guest],
      households: [household],
    });
    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.left(new Error('Failed to save')));

    const useCase = new AddGuestToHousehold(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );

    const response = await useCase.execute({
      guestId: guest.id,
      householdId: household.id,
    })(loggerEnv)();

    expect(response).toEqual(E.left(new FailedToAddGuestToHousehold()));
  });
});
