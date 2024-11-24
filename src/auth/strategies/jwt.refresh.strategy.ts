import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { TokenPayload } from '../types/tokenPayload.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        const token = req.body?.refreshToken;
        if (!token) {
          throw new UnauthorizedException('Refresh token missing in body');
        }
        return token;
      },
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: TokenPayload) {
    const refreshToken = request.body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing in body');
    }
    await this.authService.verifyUserRefreshToken(refreshToken, payload.id);
    return payload;
  }
}
