import {
  Inject,
  Injectable,
  InternalServerErrorException,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { EntityManager, QueryRunner, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { SerializedUser } from './types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly entityManager: EntityManager,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<SerializedUser> {
    const queryRunner: QueryRunner =
      this.entityManager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const user = userRepo.create(createUserDto);
      await userRepo.save(user);
      await queryRunner.commitTransaction();
      return new SerializedUser(user);
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        'Transaction failed',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getUserByEmail(email: string) {
    try {
      const user = await this.userRepo.findOne({
        where: {
          email,
        },
      });
      if (!user) {
        throw new NotFoundException('User Not Found ');
      }
      return user;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getUserById(id: string) {
    try {
      const user = await this.userRepo.findOne({
        where: {
          id,
        },
      });
      if (!user) {
        throw new NotFoundException('User ID Not Found ');
      }
      return user;
    } catch (error) {
      this.logger.error(error);
    }
  }
  async findAll() {
    try {
      const users = await this.userRepo.find({});
      return users;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<SerializedUser> {
    const queryRunner: QueryRunner =
      this.entityManager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const user = await userRepo.findOne({ where: { id } });

      if (!user) {
        throw new Error(`User with ID #${id} not found`);
      }

      userRepo.merge(user, updateUserDto);
      const updatedUser = await userRepo.save(user);
      await queryRunner.commitTransaction();
      return new SerializedUser(updatedUser);
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        'Transaction failed',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
