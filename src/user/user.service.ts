import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  ) {}
  async create(createUserDto: CreateUserDto): Promise<SerializedUser> {
    const queryRunner: QueryRunner =
      this.entityManager.connection.createQueryRunner();

    // Establish a new transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get repositories from QueryRunner
      const userRepo = queryRunner.manager.getRepository(User);

      // Create and save the user
      const user = userRepo.create(createUserDto);
      await userRepo.save(user);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Return the serialized user
      return new SerializedUser(user);
    } catch (error) {
      // Rollback the transaction in case of an error
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        'Transaction failed',
        error.message,
      );
    } finally {
      // Release the QueryRunner, regardless of success or failure
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
    } catch (e) {
      console.log(e);
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
        throw new NotFoundException('User Not Found ');
      }
      return user;
    } catch (e) {
      console.log(e);
    }
  }
  async findAll() {
    try {
      const users = await this.userRepo.find({});
      return users;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return await this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const userRepo = transactionalEntityManager.getRepository(User);

        const user = await userRepo.findOne({ where: { id } });
        if (!user) {
          throw new Error(`User with ID #${id} not found`);
        }

        userRepo.merge(user, updateUserDto);

        const updatedUser = await userRepo.save(user);

        return new SerializedUser(updatedUser);
      },
    );
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
