import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Session,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticateUserDto } from './dto/auth.dto';
import { LocalAuthGuard } from './local.auth.guard';
import { Request } from 'express';
import { AuthenticatedGuard } from './authenticated.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @UseGuards(AuthenticatedGuard)
  @Get('me')
  async getAuthUser(
    @Session() session: { passport: { user: { id: string } } },
  ) {
    const user = await this.authService.getUserById(session.passport.user.id);

    delete user.updatedAt;

    return user;
  }

  @Post('/')
  async authenticateUser(@Body() dto: AuthenticateUserDto) {
    return await this.authService.authenticateUser(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: Request) {
    return req.user;
  }

  @Get('logout')
  logout(@Req() req: Request) {
    req.session.destroy((e) => console.log(e));
    return { msg: 'The user session has ended' };
  }
}
