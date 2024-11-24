import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { EntityManager, QueryRunner, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly entityManager: EntityManager,
  ) {}
  create(user: User, createTaskDto: CreateTaskDto) {
    const task = this.taskRepository.create({ ...createTaskDto, user });
    return this.taskRepository.save(task);
  }

  async findAll(user: User, page: number = 1, limit: number = 10) {
    const [tasks, total] = await this.taskRepository.findAndCount({
      where: { user: { id: user.id } },
      take: limit, 
      skip: (page - 1) * limit, 
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: tasks,
      page,
      limit,
      total,
      totalPages,
    };
  }

  async findOne(id: string, user: User) {
    const task = await this.taskRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!task) {
      throw new BadRequestException(
        'Task not found or you do not have access to it.',
      );
    }

    return task;
  }

  async update(id: string, user: User, updateTaskDto: UpdateTaskDto) {
    const task = await this.taskRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!task) {
      throw new BadRequestException(
        'Task not found or you do not have permission to update it.',
      );
    }

    // Update the task with the provided details
    Object.assign(task, updateTaskDto);

    // Save and return the updated task
    return this.taskRepository.save(task);
  }

  async remove(id: string, user: User) {
    // Check if the task exists and belongs to the logged-in user
    const task = await this.taskRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!task) {
      throw new BadRequestException(
        'Task not found or you do not have permission to delete it.',
      );
    }

    // Perform soft delete
    await this.taskRepository.softDelete(id);

    return { message: 'Task deleted successfully' };
  }
}
