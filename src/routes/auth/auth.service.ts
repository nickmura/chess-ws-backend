import { Injectable } from '@nestjs/common';
import { AuthenticateUserDto } from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async authenticateUser(data: AuthenticateUserDto) {
    // console.log(data);
    const userExists = await this.userRepository.findOne({
      where: {
        id: data.username,
      },
    });

    if (userExists) {
      return await this.loginUser(userExists.id);
    }

    return await this.registerUser(data.username);
  }

  async loginUser(id: string) {
    // logic for id validation/siging etc?
    // console.log(id);

    return await this.getUserById(id);
  }

  async registerUser(walletAddress: string) {
    const user = new User();
    user.id = walletAddress;

    // console.log(user, 'User');

    return await this.userRepository.save(user);
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    return user;
  }
}
