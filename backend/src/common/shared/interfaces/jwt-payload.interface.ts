// interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string; // user ID
  email: string; // user email
  role?: string;
  name?: string;
  mobile?: string;
  iat?: number; // issued at
  exp?: number; // expiration
}
