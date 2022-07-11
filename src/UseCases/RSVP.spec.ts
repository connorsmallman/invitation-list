import { randEmail, randFood, randFullName, randUuid } from '@ngneat/falso';
import { either as E, taskEither as TE, option as O } from 'fp-ts';

import { InvitationListRepository } from '../Repositories/InvitationListRepository';
import { RSVP } from './RSVP';
import { InvitationList } from '../Domain/InvitationList';
import { HouseholdNotFound } from '../Domain/Problems/HouseholdNotFound';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { loggerEnv } from '../Utlities/Logger';

describe('RSVP', () => {
  test('it should update the guests', async () => {
    const findMock = jest.fn();
    const saveMock = jest.fn();
    const InvitationListRepositoryMock = <jest.Mock<InvitationListRepository>>(
      (<unknown>jest.fn(() => ({
        find: findMock,
        save: saveMock,
      })))
    );

    const email = randEmail();
    const guestId1 = randUuid();

    const guest1 = {
      name: randFullName(),
      id: guestId1,
      dietaryRequirements: '',
      isChild: false,
      attending: null,
      household: 1,
    };

    const guestId2 = randUuid();

    const guest2 = {
      name: randFullName(),
      id: guestId2,
      dietaryRequirements: '',
      isChild: false,
      attending: null,
      household: 1,
    };

    const household = {
      id: 1,
      code: 'code',
      email,
      guests: [guestId1, guestId2],
    };

    const invitationListMock = InvitationList.create({
      guests: [guest1, guest2],
      households: [household],
    });

    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.of(null));

    const dietaryRequirements = randFood();
    const isAttending = true;

    const useCase = new RSVP(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );

    const response = await useCase.execute({
      householdCode: 'code',
      email,
      guests: [
        {
          id: guest1.id,
          name: guest1.name,
          dietaryRequirements,
          attending: true,
        },
        {
          id: guest2.id,
          name: guest2.name,
          dietaryRequirements,
          attending: true,
        },
      ],
    })(loggerEnv)();

    expect(findMock).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        guests: [
          {
            ...guest1,
            household: O.some(1),
            dietaryRequirements: O.some(dietaryRequirements),
            attending: O.some(isAttending),
            isChild: false,
          },
          {
            ...guest2,
            household: O.some(1),
            dietaryRequirements: O.some(dietaryRequirements),
            attending: O.some(isAttending),
            isChild: false,
          },
        ],
        households: [
          {
            ...household,
            email: O.some(household.email),
          },
        ],
      }),
    );
    expect(response).toEqual(E.right(household));
  });

  test('should fail if household not found', async () => {
    const findMock = jest.fn();
    const saveMock = jest.fn();
    const InvitationListRepositoryMock = <jest.Mock<InvitationListRepository>>(
      (<unknown>jest.fn(() => ({
        find: findMock,
        save: saveMock,
      })))
    );

    const household = {
      id: 1,
      code: 'code',
      email: randEmail(),
      guests: [],
    };

    const invitationListMock = InvitationList.create({
      households: [household],
    });
    const guestName = randFullName();
    const guestId = randUuid();
    const guest = {
      name: guestName,
      id: guestId,
      dietaryRequirements: '',
      attending: true,
    };

    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.of(null));

    const useCase = new RSVP(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );

    const response = await useCase.execute({
      householdCode: 'some-wrong-code',
      email: randEmail(),
      guests: [guest],
    })(loggerEnv)();

    expect(response).toEqual(E.left(new HouseholdNotFound()));
  });
});
