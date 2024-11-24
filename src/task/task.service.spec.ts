import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { Task } from './entities/task.entity';
import { EntityManager, QueryRunner, Repository, UpdateResult } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { getMockedQueryRunner } from '../mocks/query-runner.mock';

describe('TaskService', () => {
  let service: TaskService;
  let mockTaskRepository: Partial<Repository<Task>>;
  let mockEntityManager: Partial<EntityManager>;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    // Mock Repository methods
    mockTaskRepository = {
      findAndCount: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    // Mock EntityManager methods
    mockEntityManager = {
      connection: {
        createQueryRunner: jest.fn().mockReturnValue({
          connect: jest.fn(),
          startTransaction: jest.fn(),
          manager: {
            findOne: jest.fn(),
            softDelete: jest.fn(),
          },
          commitTransaction: jest.fn(),
          rollbackTransaction: jest.fn(),
          release: jest.fn(),
        }),
      },
    } as unknown as EntityManager;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    queryRunner = getMockedQueryRunner(); // Mocked QueryRunner
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return paginated tasks for a user', async () => {
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

    const totalTasks = 20; // Example of total number of tasks
    const page = 2;
    const limit = 5;

    // Mock the repository method for findAndCount
    jest
      .spyOn(mockTaskRepository, 'findAndCount')
      .mockResolvedValue([mockTasks, totalTasks]);

    const result = await service.findAll(mockUser, page, limit);

    // Assert the findAndCount method was called correctly with pagination
    expect(mockTaskRepository.findAndCount).toHaveBeenCalledWith({
      where: { user: { id: mockUser.id } },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Assert the result structure
    expect(result).toEqual({
      data: mockTasks,
      page,
      limit,
      total: totalTasks,
      totalPages: Math.ceil(totalTasks / limit),
    });
  });

  it('should return the task if it exists and belongs to the user', async () => {
    // Arrange
    const mockUser: User = {
      id: 'user-id',
      email: 'user@example.com',
      password: 'hashedPassword',
      refreshToken: null,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      hashPasword: jest.fn(),
    };

    const mockTask: Task = {
      id: 'task-id',
      title: 'Sample Task',
      description: 'Task Description',
      dueDate: new Date(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      user: mockUser,
    };

    jest.spyOn(mockTaskRepository, 'findOne').mockResolvedValue(mockTask);

    // Act
    const result = await service.findOne(mockTask.id, mockUser);

    // Assert
    expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
      where: { id: mockTask.id, user: { id: mockUser.id } },
    });
    expect(result).toEqual(mockTask);
  });

  it('should throw BadRequestException if task does not exist', async () => {
    // Arrange
    const mockUser: User = {
      id: 'user-id',
      email: 'user@example.com',
      password: 'hashedPassword',
      refreshToken: null,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      hashPasword: jest.fn(),
    };

    jest.spyOn(mockTaskRepository, 'findOne').mockResolvedValue(null);

    // Act & Assert
    await expect(service.findOne('invalid-task-id', mockUser)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'invalid-task-id', user: { id: mockUser.id } },
    });
  });

  it('should update and return the task if it exists and belongs to the user', async () => {
    // Arrange
    const mockUser: User = {
      id: 'user-id',
      email: 'user@example.com',
      password: 'hashedPassword',
      refreshToken: null,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      hashPasword: jest.fn(),
    };

    const mockTask: Task = {
      id: 'task-id',
      title: 'Old Title',
      description: 'Old Description',
      dueDate: new Date(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      user: mockUser,
    };

    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Title',
      description: 'Updated Description',
      completed: true,
    };

    jest.spyOn(mockTaskRepository, 'findOne').mockResolvedValue(mockTask);
    jest.spyOn(mockTaskRepository, 'save').mockResolvedValue({
      ...mockTask,
      ...updateTaskDto,
    });

    // Act
    const result = await service.update(mockTask.id, mockUser, updateTaskDto);

    // Assert
    expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
      where: { id: mockTask.id, user: { id: mockUser.id } },
    });
    expect(mockTaskRepository.save).toHaveBeenCalledWith({
      ...mockTask,
      ...updateTaskDto,
    });
    expect(result).toEqual({ ...mockTask, ...updateTaskDto });
  });

  it('should delete the task if it exists and belongs to the user', async () => {
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

    const mockTask: Task = {
      id: 'task-id',
      title: 'Sample Task',
      description: 'Task Description',
      dueDate: new Date(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      user: mockUser,
    };

    // Mock methods to simulate task existence and deletion
    jest.spyOn(mockTaskRepository, 'findOne').mockResolvedValue(mockTask);
    // Create a mock UpdateResult for softDelete
    const updateResult: UpdateResult = {
      raw: [],
      affected: 1,
      generatedMaps: [],
    };
    jest
      .spyOn(mockTaskRepository, 'softDelete')
      .mockResolvedValue(updateResult);

    // Act
    const result = await service.remove('task-id', mockUser);

    // Assert
    expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'task-id', user: { id: 'user-id' } },
    });
    expect(mockTaskRepository.softDelete).toHaveBeenCalledWith('task-id');
    expect(result).toEqual({ message: 'Task deleted successfully' });
  });

  it('should throw BadRequestException if task does not exist or does not belong to the user', async () => {
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

    // Mock task not found
    jest.spyOn(mockTaskRepository, 'findOne').mockResolvedValue(null);

    // Act & Assert
    await expect(service.remove('invalid-task-id', mockUser)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'invalid-task-id', user: { id: 'user-id' } },
    });
    expect(mockTaskRepository.softDelete).not.toHaveBeenCalled();
  });

  it('should create a task successfully', async () => {
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

    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'Task description',
      dueDate: new Date(),
      completed: false,
    };

    const task: Task = {
      id: 'task-id',
      title: 'New Task',
      description: 'Task description',
      dueDate: new Date(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      user: mockUser,
    };

    // Mock the methods
    jest.spyOn(mockTaskRepository, 'create').mockReturnValue(task); // Mock `create` to return the task
    jest.spyOn(mockTaskRepository, 'save').mockResolvedValue(task); // Mock `save` to return the task

    // Act
    const result = await service.create(mockUser, createTaskDto);

    // Assert
    expect(mockTaskRepository.create).toHaveBeenCalledWith({
      ...createTaskDto,
      user: mockUser,
    });
    expect(mockTaskRepository.save).toHaveBeenCalledWith(task);
    expect(result).toEqual(task);
  });

  it('should throw an error if the task could not be created', async () => {
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

    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'Task description',
      dueDate: new Date(),
      completed: false,
    };

    // Mock save to simulate an error scenario
    jest
      .spyOn(mockTaskRepository, 'save')
      .mockRejectedValue(new Error('Could not create task'));

    // Act & Assert
    await expect(service.create(mockUser, createTaskDto)).rejects.toThrowError(
      'Could not create task',
    );
    expect(mockTaskRepository.save).toHaveBeenCalled();
  });
});
