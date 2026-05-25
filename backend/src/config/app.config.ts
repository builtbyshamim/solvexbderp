import { registerAs } from '@nestjs/config';
import { getNumberEnv } from 'src/common/helpers/helpers';
export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'my-app',
  port: getNumberEnv('PORT',5000) ,
  apiPrefix: process.env.API_PREFIX || 'api',
  fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'en',
  headerLanguage: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
}));