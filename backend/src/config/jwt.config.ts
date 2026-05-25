import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  return {
    secret: process.env.JWT_SECRET,
    issuer: process.env.JWT_TOKEN_ISSUER,
    audience: process.env.JWT_TOKEN_AUDIENCE,
    accessTokenTtl: Number(process.env.JWT_ACCESS_TOKEN_TTL),
    refreshTokenTtl: Number(process.env.JWT_REFRESH_TOKEN_TTL),
  };
});
