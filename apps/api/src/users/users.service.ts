import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
