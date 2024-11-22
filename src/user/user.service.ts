import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
  async create(createUserDto: CreateUserDto) {
    return await this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const userRepo = transactionalEntityManager.getRepository(User);
        const user = userRepo.create(createUserDto);
        await userRepo.save(user);

        return new SerializedUser(user);
      },
    );
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
    } catch (e) {}
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return await this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const userRepo = transactionalEntityManager.getRepository(User);

        // Find the user by ID
        const user = await userRepo.findOne({ where: { id } });
        if (!user) {
          throw new Error(`User with ID #${id} not found`);
        }

        // Merge the update data into the existing user
        userRepo.merge(user, updateUserDto);

        // Save the updated user to the database
        const updatedUser = await userRepo.save(user);

        return new SerializedUser(updatedUser);
      },
    );
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
