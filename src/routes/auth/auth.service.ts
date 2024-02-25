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
        walletAddress: data.username,
      },
    });

    if (userExists) {
      return await this.loginUser(userExists.walletAddress);
    }

    return await this.registerUser(data.username);
  }

  async loginUser(walletAddress: string) {
    // logic for walletAddress validation/siging etc?
    // console.log(walletAddress);

    return await this.getUserByWalletAddress(walletAddress);
  }

  async registerUser(walletAddress: string) {
    const user = new User();
    user.walletAddress = walletAddress;

    // console.log(user, 'User');

    return await this.userRepository.save(user);
  }

  async getUserByWalletAddress(walletAddress: string) {
    const user = await this.userRepository.findOne({
      where: { walletAddress },
    });

    return user;
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    return user;
  }
}
