import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.AUTH_SECRET, // Replace with your own secret key
    });
  }

  async validate(payload: any): Promise<{ id: string }> {
    console.log('in validate', payload);

    // const user = await this.userService.findById(payload.sub);
    // if (!user) {
    //   throw new UnauthorizedException();
    // }
    // return user;
    const user = await this.authService.getUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    // console.log(username, password, 'pesos');

    return { id: user.id };
  }
}
