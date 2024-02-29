import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticateUserDto } from './dto/auth.dto';
// import { LocalAuthGuard } from './local.auth.guard';
import { Request } from 'express';
// import { AuthenticatedGuard } from './authenticated.guard';
// import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './local.auth.guard';
// import { AuthenticatedGuard } from './authenticated.guard';
// import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedGuard } from './authenticated.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @UseGuards(AuthenticatedGuard)
  @Get('me')
  async getAuthUser(@Req() req: Request & { user: { id: string } }) {
    const user = await this.authService.getUserById(req.user.id);

    delete user.updatedAt;

    return user;
  }

  @Post('/')
  async authenticateUser(@Body() dto: AuthenticateUserDto) {
    return await this.authService.authenticateUser(dto);
  }

  // @UseGuards(LocalAuthGuard)
  // @Post('login')
  // login(@Req() req: Request) {
  //   return req.user;
  // }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request): Promise<any> {
    const user = req.user;
    const token = await this.authService.login(user as any);

    return { token };
  }

  // @Get('logout')
  // logout(@Req() req: Request) {
  //   req.session.destroy((e) => console.log(e));
  //   return { msg: 'The user session has ended' };
  // }
}
