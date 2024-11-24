import {
  Inject,
  Injectable,
  LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { User } from '../user/entities/user.entity';
import { Response } from 'express';
import { UserService } from '../user/user.service';
import { TokenPayload } from './types/tokenPayload.interface';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}
  async verifyUser(email: string, password: string) {
    try {
      const user = await this.userService.getUserByEmail(email);
      const authenticated = await compare(password, user.password);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Credential is not valid ');
    }
  }

  async login(user: User, response: Response) {
    try {
      const accessTokenExpirationMs =
        parseInt(
          this.configService
            .getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRATION_MS')
            .trim(),
        ) || 3600000;

      const refreshTokenExpirationMs =
        parseInt(
          this.configService
            .getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRATION_MS')
            .trim(),
        ) || 604800000;

      const expiresAccessToken = new Date();
      expiresAccessToken.setMilliseconds(
        expiresAccessToken.getTime() + accessTokenExpirationMs,
      );

      const expiresRefreshToken = new Date();
      expiresRefreshToken.setMilliseconds(
        expiresRefreshToken.getTime() + refreshTokenExpirationMs,
      );

      const tokenPayload: TokenPayload = {
        email: user.email,
        id: user.id,
      };

      const accessToken = this.jwtService.sign(tokenPayload, {
        secret: this.configService.getOrThrow<string>(
          'JWT_ACCESS_TOKEN_SECRET',
        ),
        expiresIn: Math.floor(accessTokenExpirationMs / 1000),
      });

      const refreshToken = this.jwtService.sign(tokenPayload, {
        secret: this.configService.getOrThrow<string>(
          'JWT_REFRESH_TOKEN_SECRET',
        ),
        expiresIn: Math.floor(refreshTokenExpirationMs / 1000),
      });

      await this.userService.update(user.id, {
        refreshToken: await hash(refreshToken, 10),
      });
      response.send({
        user,
        accessToken,
        refreshToken,
        accessTokenExpiresIn: accessTokenExpirationMs,
        refreshTokenExpiresIn: refreshTokenExpirationMs,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async verifyUserRefreshToken(refreshToken: string, userId: string) {
    const user = await this.userService.getUserById(userId);
    if (!user || !user.refreshToken) {
      this.logger.error('Invalid user or refresh token missing');
      throw new UnauthorizedException('Invalid user or refresh token missing');
    }

    const isValid = await compare(refreshToken, user.refreshToken);
    if (!isValid) {
      this.logger.error('Invalid refresh token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    return user;
  }

  async logout(user: User, response: Response) {
    try {
      await this.userService.update(user.id, { refreshToken: null });
      response.send({ message: 'Logged out successfully' });
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Unable to log out');
    }
  }
}
