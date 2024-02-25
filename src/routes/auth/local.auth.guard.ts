import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext) {
    // console.log('context', context);

    const result = (await super.canActivate(context)) as boolean;
    // console.log(result, 'result');

    const request = context.switchToHttp().getRequest();
    // console.log(request, 'reqst');
    // const superLoginRes =
    await super.logIn(request);

    // console.log({ superLoginRes });
    return result;
  }
}
