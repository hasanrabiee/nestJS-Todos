import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../user/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './entities/task.entity';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

describe('TaskController', () => {
  let controller: TaskController;
  let taskService: TaskService;

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [{ provide: TaskService, useValue: mockTaskService }],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call taskService.create with correct arguments', async () => {
    // Arrange
    const mockUser: User = {
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

    const createTaskDto: CreateTaskDto = {
      title: 'Sample Task',
      description: 'A sample task description',
      dueDate: new Date(),
      completed: false,
    };

    const expectedResult = {
      id: '1',
      ...createTaskDto,
      user: mockUser,
    };

    mockTaskService.create.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.create(mockUser, createTaskDto);

    // Assert
    expect(taskService.create).toHaveBeenCalledWith(mockUser, createTaskDto);
    expect(result).toEqual(expectedResult);
  });

  it('should call taskService.findAll with the correct user and return tasks', async () => {
    // Arrange
    const mockUser: User = {
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

    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        description: 'Task 1 description',
        dueDate: new Date(),
        completed: false,
        user: mockUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
      {
        id: '2',
        title: 'Task 2',
        description: 'Task 2 description',
        dueDate: new Date(),
        completed: true,
        user: mockUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ];

    mockTaskService.findAll.mockResolvedValue(mockTasks);

    // Act
    const result = await controller.findAll(mockUser);

    // Assert
    expect(taskService.findAll).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockTasks);
  });

  it('should call taskService.remove with correct arguments and return success message', async () => {
    // Arrange
    const mockUser: User = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedPassword',
      refreshToken: null,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      hashPasword: jest.fn(),
    };

    const taskId = 'task-id';
    const successMessage = { message: 'Task deleted successfully' };

    mockTaskService.remove.mockResolvedValue(successMessage);

    // Act
    const result = await controller.remove(taskId, mockUser);

    // Assert
    expect(taskService.remove).toHaveBeenCalledWith(taskId, mockUser);
    expect(result).toEqual(successMessage);
  });

  it('should throw BadRequestException if taskService.remove throws an error', async () => {
    // Arrange
    const mockUser: User = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedPassword',
      refreshToken: null,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      hashPasword: jest.fn(),
    };

    const taskId = 'task-id';
    const errorMessage =
      'Task not found or you do not have permission to delete it.';

    mockTaskService.remove.mockRejectedValue(
      new BadRequestException(errorMessage),
    );

    // Act & Assert
    await expect(controller.remove(taskId, mockUser)).rejects.toThrow(
      BadRequestException,
    );
    expect(taskService.remove).toHaveBeenCalledWith(taskId, mockUser);
  });

  it('should update and return the task if it belongs to the user', async () => {
    const mockUser: User = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedPassword',
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      refreshToken: null,
      hashPasword: jest.fn(),
    };

    const mockTask: Task = {
      id: '1',
      title: 'Original Title',
      description: 'Original Description',
      dueDate: new Date(),
      completed: false,
      user: mockUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    const updateTaskDto = {
      title: 'Updated Title',
      description: 'Updated Description',
      completed: true,
    };

    mockTaskService.update.mockResolvedValue({
      ...mockTask,
      ...updateTaskDto,
    });

    const result = await controller.update('1', mockUser, updateTaskDto);

    expect(taskService.update).toHaveBeenCalledWith(
      '1',
      mockUser,
      updateTaskDto,
    );
    expect(result).toEqual({ ...mockTask, ...updateTaskDto });
  });

  it('should throw an error if the task does not exist or does not belong to the user', async () => {
    const mockUser: User = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedPassword',
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      refreshToken: null,
      hashPasword: jest.fn(),
    };

    const updateTaskDto = {
      title: 'Updated Title',
      description: 'Updated Description',
      completed: true,
    };

    mockTaskService.update.mockRejectedValue(
      new BadRequestException(
        'Task not found or you do not have permission to update it.',
      ),
    );

    await expect(
      controller.update('1', mockUser, updateTaskDto),
    ).rejects.toThrow(BadRequestException);

    expect(taskService.update).toHaveBeenCalledWith(
      '1',
      mockUser,
      updateTaskDto,
    );
  });
});
