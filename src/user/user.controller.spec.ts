import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { SerializedUser } from './types';
import { User } from './entities/user.entity';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a user and return the serialized user', async () => {
      const createUserDto: CreateUserDto = {
        password: 'password123',
        email: 'testuser@example.com',
        refreshToken: null,
      };
      const serializedUser = new SerializedUser({
        id: '1',
        email: createUserDto.email,
      });

      jest.spyOn(userService, 'create').mockResolvedValue(serializedUser);

      const result = await userController.create(createUserDto);

      expect(result).toEqual(serializedUser);
      expect(userService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw an error if service fails', async () => {
      const createUserDto: CreateUserDto = {
        password: 'password123',
        email: 'testuser@example.com',
        refreshToken: null,
      };

      jest
        .spyOn(userService, 'create')
        .mockRejectedValue(
          new InternalServerErrorException('Transaction failed'),
        );

      try {
        await userController.create(createUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Transaction failed');
      }

      expect(userService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  it('should return a list of users successfully', async () => {
    const mockUsers: User[] = [
      {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        tasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        refreshToken: null,
        hashPasword: jest.fn(),
      },
    ];
    jest.spyOn(userService, 'findAll').mockResolvedValue(mockUsers);
    const result = await userController.getUsers();
    expect(userService.findAll).toHaveBeenCalled();
    expect(result).toEqual(mockUsers);
  });
});
