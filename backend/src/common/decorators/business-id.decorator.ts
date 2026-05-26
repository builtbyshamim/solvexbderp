import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const BusinessId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const businessId = request.user?.businessId;
    if (!businessId) {
      throw new UnauthorizedException('Business profile not set up. Please complete your business setup first.');
    }
    return businessId;
  },
);
