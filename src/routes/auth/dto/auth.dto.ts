import { IsString } from 'class-validator';

export class AuthenticateUserDto {
  @IsString()
  username: string;
}
