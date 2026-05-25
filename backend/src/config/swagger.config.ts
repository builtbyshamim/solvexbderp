// ==========================================
// src/config/swagger.config.ts
// ==========================================
import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('NestJS API')
  .setDescription('NestJS API with TypeORM, Redis, and Best Practices')
  .setVersion('1.0')
  .addTag('users')
  .addTag('auth')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .build();