import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateNicknameDto } from './dto/user.dto';
import { AuthenticatedGuard } from '../auth/authenticated.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @UseGuards(AuthenticatedGuard)
  @Patch('nickname')
  async updateNickname(
    @Body() data: UpdateNicknameDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    const user = await this.userService.updateNickname(
      req.user.id,
      data.nickname,
    );

    delete user.updatedAt;

    return user;
  }
}
