import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const getCurrentUser = (context: ExecutionContext) =>
  context.switchToHttp().getRequest().user;

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => getCurrentUser(context),
);
