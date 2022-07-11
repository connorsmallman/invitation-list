import { randEmail, randFullName, randUuid } from '@ngneat/falso';
import { taskEither as TE, either as E, option as O } from 'fp-ts';

import { AddGuest } from './AddGuest';
import { InvitationListRepository } from '../Repositories/InvitationListRepository';
import { GuestWithThatNameAlreadyExists } from '../Domain/Problems/GuestWithThatNameAlreadyExists';
import { FailedToAddGuest } from '../Domain/Problems/FailedToAddGuest';
import { InvitationList } from '../Domain/InvitationList';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { loggerEnv } from '../Utlities/Logger';

describe('Add guest', () => {
  test('add new guest', async () => {
    const findMock = jest.fn();
    const saveMock = jest.fn();
    const InvitationRepositoryMock = <jest.Mock<InvitationListRepository>>(
      (<unknown>jest.fn(() => ({
        find: findMock,
        save: saveMock,
      })))
    );
    const invitationListMock = InvitationList.create({
      guests: [],
      households: [],
    });
    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.of(null));
    const useCase = new AddGuest(
      new InvitationRepositoryMock(),
      new EventEmitter2(),
    );
    const guestName = randFullName();
    const guestId = randUuid();
    const command = {
      name: guestName,
      id: guestId,
    };

    const guest = {
      name: guestName,
      id: guestId,
      dietaryRequirements: '',
      isChild: false,
      attending: null,
      household: null,
    };

    const response = await useCase.execute(command)(loggerEnv)();

    if (E.isLeft(response)) {
      throw new Error(response.left.message);
    }

    expect(findMock).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        guests: [
          {
            ...guest,
            household: O.none,
            dietaryRequirements: O.none,
            attending: O.none,
          },
        ],
        households: [],
      }),
    );
    expect(response.right).toEqual({
      ...guest,
      dietaryRequirements: null,
    });
  });

  test('should fail if guest already exists', async () => {
    const findMock = jest.fn();
    const saveMock = jest.fn();
    const InvitationRepositoryMock = <jest.Mock<InvitationListRepository>>(
      (<unknown>jest.fn(() => ({
        find: findMock,
        save: saveMock,
      })))
    );
    const useCase = new AddGuest(
      new InvitationRepositoryMock(),
      new EventEmitter2(),
    );
    const guestName = randFullName();
    const guestId = randUuid();
    const command = {
      name: guestName,
      id: guestId,
    };

    const guest = {
      name: guestName,
      id: guestId,
      dietaryRequirements: '',
      isChild: false,
      attending: null,
      household: null,
    };

    const invitationListMock = InvitationList.create({
      guests: [guest],
      households: [],
    });
    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.of(null));

    const response = await useCase.execute(command)(loggerEnv)();
    expect(response).toEqual(E.left(new GuestWithThatNameAlreadyExists()));
  });

  test('should fail if unable to create guest', async () => {
    const findMock = jest.fn();
    const saveMock = jest.fn();
    const InvitationRepositoryMock = <jest.Mock<InvitationListRepository>>(
      (<unknown>jest.fn(() => ({
        find: findMock,
        save: saveMock,
      })))
    );
    const invitationListMock = InvitationList.create({});
    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.of(null));
    const useCase = new AddGuest(
      new InvitationRepositoryMock(),
      new EventEmitter2(),
    );
    const guestEmail = randEmail();
    const guestId = randUuid();
    const command = {
      name: 'h',
      email: guestEmail,
      id: guestId,
    };

    const response = await useCase.execute(command)(loggerEnv)();
    expect(response).toEqual(E.left(new FailedToAddGuest()));
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
    const invitationListMock = InvitationList.create({});
    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.left(new Error('could not save')));
    const useCase = new AddGuest(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );
    const guestName = randFullName();
    const guestEmail = randEmail();
    const guestId = randUuid();
    const command = {
      name: guestName,
      email: guestEmail,
      id: guestId,
    };

    const response = await useCase.execute(command)(loggerEnv)();
    expect(response).toEqual(E.left(new FailedToAddGuest()));
  });
});
