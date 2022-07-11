import { InvitationListRepository } from '../Repositories/InvitationListRepository';
import { taskEither as TE, either as E } from 'fp-ts';
import { CreateHousehold } from './CreateHousehold';
import { InvitationList } from '../Domain/InvitationList';
import { FailedToGetNextHouseholdId } from '../Domain/Problems/FailedToGetNextHouseholdId';
import { FailedToCreateHousehold } from '../Domain/Problems/FailedToCreateHousehold';
import { FailedToGenerateHouseholdCode } from '../Domain/Problems/FailedToGenerateHouseholdCode';
import { Household } from '../Domain/Household';
import { HouseholdAlreadyExists } from '../Domain/Problems/HouseholdAlreadyExists';
import { randEmail } from '@ngneat/falso';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { loggerEnv } from '../Utlities/Logger';

describe('Create Household', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('should add a new household', async () => {
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

    const useCase = new CreateHousehold(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );

    const response = await useCase.execute()(loggerEnv)();

    expect(response).toMatchInlineSnapshot(`
      Object {
        "_tag": "Right",
        "right": Object {
          "code": "tqd3B",
          "email": "",
          "guests": Array [],
          "id": 1,
        },
      }
    `);
  });

  test('should fail if unable to create id', async () => {
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

    jest
      .spyOn(InvitationList, 'getNextHouseholdId')
      .mockReturnValue(E.left(new FailedToGetNextHouseholdId()));

    const useCase = new CreateHousehold(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );

    const response = await useCase.execute()(loggerEnv)();

    expect(response).toEqual(E.left(new FailedToCreateHousehold()));
  });

  test('should fail if unable to generate code', async () => {
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

    jest
      .spyOn(InvitationList, 'generateHouseholdCode')
      .mockReturnValue(E.left(new FailedToGenerateHouseholdCode()));

    const useCase = new CreateHousehold(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );

    const response = await useCase.execute()(loggerEnv)();

    expect(response).toEqual(E.left(new FailedToCreateHousehold()));
  });

  test('should fail if unable to create household', async () => {
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

    jest
      .spyOn(Household, 'create')
      .mockReturnValue(E.left(new FailedToCreateHousehold()));

    const useCase = new CreateHousehold(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );

    const response = await useCase.execute()(loggerEnv)();

    expect(response).toEqual(E.left(new FailedToCreateHousehold()));
  });

  test('should fail if unable to add new household to guest list', async () => {
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
      code: 'tqd3B',
      guests: [],
      email: randEmail(),
    };

    const invitationListMock = InvitationList.create({
      households: [household],
    });
    findMock.mockReturnValue(TE.fromEither(invitationListMock));
    saveMock.mockReturnValue(TE.of(null));

    jest
      .spyOn(InvitationList, 'addHousehold')
      .mockReturnValue(E.left(new HouseholdAlreadyExists()));

    const useCase = new CreateHousehold(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );

    const response = await useCase.execute()(loggerEnv)();

    expect(response).toEqual(E.left(new FailedToCreateHousehold()));
  });

  test('should fail if unable to save guest list', async () => {
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
    saveMock.mockReturnValue(TE.left(new Error()));

    const useCase = new CreateHousehold(
      new InvitationListRepositoryMock(),
      new EventEmitter2(),
    );

    const response = await useCase.execute()(loggerEnv)();

    expect(response).toEqual(E.left(new FailedToCreateHousehold()));
  });
});
