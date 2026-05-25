import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import imagekitConfig from './imagekit.config';
import { ImageKitService } from './imagekit.service';

@Global()
@Module({
  imports: [ConfigModule.forFeature(imagekitConfig)],
  providers: [ImageKitService],
  exports: [ImageKitService],
})
export class ImageUploadModule {}
