import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthenticatedGuard extends AuthGuard('jwt') {}

// implements CanActivate {
//   async canActivate(context: ExecutionContext) {
//     const request = context.switchToHttp().getRequest();

//     // console.log(request.isAuthenticated(), request, 'AuthenticatedGuard');
//     return request.isAuthenticated();
//   }
// }
