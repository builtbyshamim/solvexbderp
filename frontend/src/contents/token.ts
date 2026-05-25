export const accessTokenKey = "access_token";
export const refreshTokenKey = "refresh_token";
export const accessTokenTTL =
  Number(import.meta.env.VITE_JWT_ACCESS_TOKEN_TTL) / (60 * 60 * 24);

export const refreshTokenTTL =
  Number(import.meta.env.VITE_JWT_REFRESH_TOKEN_TTL) / (60 * 60 * 24);
