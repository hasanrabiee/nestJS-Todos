import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser } from '../decorators/currentUser.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../user/entities/user.entity';
import { TaskResponseDto } from './dto/taskResponse.dto';

@ApiTags('Tasks')
@Controller('task')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: 201,
    description: 'task has been created.',
    type: TaskResponseDto,
  })
  @ApiBody({ type: CreateTaskDto })
  @Post()
  create(@CurrentUser() user: User, @Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(user, createTaskDto);
  }

  @ApiOperation({ summary: 'get tasks list' })
  @ApiResponse({
    status: 200,
    description: 'task has been created by the user.',
    type: [TaskResponseDto],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (defaults to 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description: 'Number of tasks per page (defaults to 10)',
    type: Number,
    example: 10,
  })
  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('size') size = 10,
  ) {
    return this.taskService.findAll(user, page, size);
  }

  @ApiOperation({ summary: 'get user task by ID' })
  @ApiResponse({
    status: 200,
    description: 'task has been created by the user.',
    type: TaskResponseDto,
  })
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.taskService.findOne(id, user);
  }

  @ApiOperation({ summary: 'update user task by ID' })
  @ApiResponse({
    status: 201,
    description: 'task has been created by the user.',
    type: TaskResponseDto,
  })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({
    status: 201,
    description: 'task has been upedated by the user.',
    type: TaskResponseDto,
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.update(id, user, updateTaskDto);
  }

  @ApiOperation({ summary: 'delete user task by ID' })
  @ApiResponse({
    status: 204,
    description: 'task has been deleted by the user.',
  })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.taskService.remove(id, user);
  }
}
