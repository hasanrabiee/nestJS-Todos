import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../decorators/currentUser.decorator';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Response } from 'express';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth-guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserResponseDto } from '../user/dto/userResponseDto';
import { RefreshTokenDto } from '../user/dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth-guard';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @ApiOperation({ summary: 'login user' })
  @ApiResponse({
    status: 201,
    description: 'User has been logged in.',
    type: UserResponseDto,
  })
  @ApiBody({
    type: CreateUserDto,
  })
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.login(user, response);
  }

  @ApiOperation({ summary: 'refresh token for  user' })
  @ApiResponse({
    status: 201,
    description: 'for refresh user.',
    type: UserResponseDto,
  })
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiBody({
    type: RefreshTokenDto,
  })
  async refreshToken(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(user, response);
  }

  @ApiOperation({ summary: 'logout user' })
  @ApiResponse({
    status: 200,
    description: 'User has been logged out.',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(user, response);
  }
}
