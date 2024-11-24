import { Controller, Get, Post, Body, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { CurrentUser } from '../decorators/currentUser.decorator';
import { User } from './entities/user.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/userResponseDto';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User has been created.',
    type: UserResponseDto,
  })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users.',
    type: [UserResponseDto],
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  getUsers() {
    return this.userService.findAll();
  }

  @ApiOperation({ summary: 'update user' })
  @ApiResponse({
    status: 200,
    description: 'update user.',
    type: [UserResponseDto],
  })
  @ApiBody({
    type: CreateUserDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch()
  update(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(user.id, updateUserDto);
  }
}
