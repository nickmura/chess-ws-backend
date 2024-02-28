import { Injectable } from '@nestjs/common';
import { AuthenticateUserDto } from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async authenticateUser(data: AuthenticateUserDto) {
    // console.log(data);
    const user = await this.userRepository.findOne({
      where: {
        id: data.username,
      },
    });

    if (user) {
      return user; // await this.loginUser(userExists.id);
    }

    return await this.registerUser(data.username);
  }

  // async loginUser(id: string) {
  //   // logic for id validation/siging etc?
  //   // console.log(id);

  //   return await this.getUserById(id);
  // }

  async login(user: User): Promise<string> {
    console.log(user, 'user in login');

    const payload = { sub: user.id };
    // return {
    //   token: this.jwtService.sign(payload),
    // };

    return this.jwtService.sign(payload);
  }

  async validateUser(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (user) {
      return user; // await this.getUserById(user.id);
    }

    return await this.registerUser(id);
  }

  async registerUser(walletAddress: string) {
    const user = new User();
    user.id = walletAddress;

    return await this.userRepository.save(user);
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    return user;
  }
}
