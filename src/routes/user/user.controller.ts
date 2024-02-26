import { Body, Controller, Patch, Session, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { UpdateNicknameDto } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @UseGuards(AuthenticatedGuard)
  @Patch('nickname')
  async updateNickname(
    @Body() data: UpdateNicknameDto,
    @Session() session: { passport: { user: { id: string } } },
  ) {
    const user = await this.userService.updateNickname(
      session.passport.user.id,
      data.nickname,
    );

    delete user.updatedAt;

    return user;
  }
}
