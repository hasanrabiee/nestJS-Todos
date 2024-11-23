import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { User } from '../user/entities/user.entity';
import { Response } from 'express';
import { UserService } from '../user/user.service';
import { TokenPayload } from './types/tokenPayload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  async verifyUser(email: string, password: string) {
    try {
      const user = await this.userService.getUserByEmail(email);
      const authenticated = await compare(password, user.password);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('Credential is not valid ');
    }
  }

  async login(user: User, response: Response) {
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
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRATION_MS')}ms`,
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRATION_MS')}ms`,
    });

    await this.userService.update(user.id, {
      refreshToken: await hash(refreshToken, 10),
    });

    response.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: expiresAccessToken,
    });

    response.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: expiresRefreshToken,
    });
  }

  async verifyUserRefreshToken(refreshToken: string, userId: string) {
    try {
      const user = await this.userService.getUserById(userId);
      console.log(refreshToken);
      const authenticated = await compare(refreshToken, user.refreshToken);
      if (!authenticated) {
        throw new UnauthorizedException('here');
      }
    } catch (e) {
      throw new UnauthorizedException('refresh token in not valid ');
    }
  }
}
