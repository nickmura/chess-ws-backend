import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async updateNickname(id: string, nickname: string) {
    const user = await this.userRepository.findOneOrFail({ where: { id } });
    user.nickname = nickname;

    return await this.userRepository.save(user);
  }
}
