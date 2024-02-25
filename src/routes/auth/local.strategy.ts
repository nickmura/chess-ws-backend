import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(
    username: string,
    // password: string,
    // done: any,
  ) {
    // console.log(walletAddress, 'walletaddress strategy', password, done);
    const user = await this.authService.getUserByWalletAddress(username);

    if (!user) {
      throw new UnauthorizedException();
    }

    // console.log(username, password, 'pesos');

    return { id: user.id };
  }
}
