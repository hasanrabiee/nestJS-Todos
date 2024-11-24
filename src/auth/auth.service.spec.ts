import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';
import { WinstonModule } from 'nest-winston'; // Correct module
import * as winston from 'winston';

describe('AuthService', () => {
  let authService: AuthService;
  let configService: ConfigService;
  let jwtService: JwtService;
  let userService: UserService;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const configMap: Record<string, string> = {
        JWT_ACCESS_TOKEN_EXPIRATION_MS: '3600000', // 1 hour
        JWT_REFRESH_TOKEN_EXPIRATION_MS: '604800000', // 7 days
        JWT_ACCESS_TOKEN_SECRET: 'access-secret',
        JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
      };
      return configMap[key];
    }),
  };

  const mockJwtService = {
    sign: jest.fn((payload, options) => `${options.secret}-token`),
  };

  const mockUserService = {
    update: jest.fn(),
    getUserByEmail: jest.fn(),
  };

  const mockResponse: Partial<Response> = {
    send: jest.fn(),
  };

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    refreshToken: null,
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    hashPasword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        // Importing NestWinstonModule
        WinstonModule.forRoot({
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
              ),
            }),
          ],
        }),
      ],
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
  });

  it('should generate tokens and update the user', async () => {
    const bcryptHashSpy = jest
      .spyOn(bcrypt, 'hash')
      .mockResolvedValue('hashed-refresh-token' as never);

    await authService.login(mockUser, mockResponse as Response);

    const expectedAccessToken = 'access-secret-token';
    const expectedRefreshToken = 'refresh-secret-token';

    // Check token generation
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
    expect(jwtService.sign).toHaveBeenCalledWith(
      { email: mockUser.email, id: mockUser.id },
      {
        secret: 'access-secret',
        expiresIn: 3600, // 3600000 ms -> seconds
      },
    );
    expect(jwtService.sign).toHaveBeenCalledWith(
      { email: mockUser.email, id: mockUser.id },
      {
        secret: 'refresh-secret',
        expiresIn: 604800, // 604800000 ms -> seconds
      },
    );

    // Check refresh token hashing
    expect(bcryptHashSpy).toHaveBeenCalledWith(expectedRefreshToken, 10);

    // Check user service update
    expect(userService.update).toHaveBeenCalledWith(mockUser.id, {
      refreshToken: 'hashed-refresh-token',
    });

    // Check response sent
    expect(mockResponse.send).toHaveBeenCalledWith({
      user: mockUser,
      accessToken: expectedAccessToken,
      refreshToken: expectedRefreshToken,
      accessTokenExpiresIn: 3600000,
      refreshTokenExpiresIn: 604800000,
    });
  });

  it('should return the user if the credentials are valid', async () => {
    // Mock UserService and bcrypt.compare
    jest.spyOn(userService, 'getUserByEmail').mockResolvedValue(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const result = await authService.verifyUser('test@example.com', 'password');

    expect(userService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('password', mockUser.password);
    expect(result).toEqual(mockUser);
  });

  it('should throw UnauthorizedException if the user is not found', async () => {
    jest
      .spyOn(userService, 'getUserByEmail')
      .mockRejectedValue(new Error('User not found'));

    await expect(
      authService.verifyUser('invalid@example.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);
    expect(userService.getUserByEmail).toHaveBeenCalledWith(
      'invalid@example.com',
    );
  });

  it('should throw UnauthorizedException if the password is incorrect', async () => {
    jest.spyOn(userService, 'getUserByEmail').mockResolvedValue(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(
      authService.verifyUser('test@example.com', 'wrong-password'),
    ).rejects.toThrow(UnauthorizedException);
    expect(userService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'wrong-password',
      mockUser.password,
    );
  });

  it('should throw UnauthorizedException if an error occurs', async () => {
    jest
      .spyOn(userService, 'getUserByEmail')
      .mockRejectedValue(new Error('Unexpected error'));

    await expect(
      authService.verifyUser('test@example.com', 'password'),
    ).rejects.toThrow(new UnauthorizedException('Credential is not valid '));
    expect(userService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
  });
});
