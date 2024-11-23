import { QueryRunner } from 'typeorm';

export const getMockedQueryRunner = () => {
  return {
    connection: {},
    broadcaster: {},
    isReleased: false,
    isTransactionActive: true,
    connect: jest.fn(),
    startTransaction: jest.fn(),
    manager: {
      findOne: jest.fn(), // mock for findOne method
      softDelete: jest.fn(), // mock for softDelete method
    },
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  } as unknown as QueryRunner; // Cast to QueryRunner type
};
