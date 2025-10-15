import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CognitoUser {
  userId: string;
  username: string;
  email: string;
  emailVerified: boolean;
  groups: string[];
  tokenUse: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CognitoUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
