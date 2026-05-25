import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';
import sharp from 'sharp'; // Changed from namespace import to default import

export interface ImageUploadOptions {
  folder?: string;
  fileName?: string;
  useUniqueFileName?: boolean;
  tags?: string[];
  customMetadata?: Record<string, any>;
}

export interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}


@Injectable()
export class ImageKitService {
  private readonly logger = new Logger(ImageKitService.name);
  private imagekit: ImageKit;

  constructor(private configService: ConfigService) {
    // Add type assertions for configuration values
    const publicKey = this.configService.get<string>('imagekit.publicKey');
    const privateKey = this.configService.get<string>('imagekit.privateKey');
    const urlEndpoint = this.configService.get<string>('imagekit.urlEndpoint');

    // Validate configuration
    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error('ImageKit configuration is incomplete. Please check your .env file');
    }

    this.imagekit = new ImageKit({
      publicKey: publicKey as string, // Type assertion since we validated it
      privateKey: privateKey as string, // Type assertion since we validated it
      urlEndpoint: urlEndpoint as string, // Type assertion since we validated it
    });
  }

  /**
   * Single image upload
   */
  async uploadImage(
    file: Express.Multer.File,
    options: ImageUploadOptions = {},
  ) {
    try {
      const fileName =
        options.fileName ||
        `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

      const uploadResponse = await this.imagekit.upload({
        file: file.buffer,
        fileName: fileName,
        folder: options.folder || '/uploads',
        useUniqueFileName: options.useUniqueFileName ?? true,
        tags: options.tags || [],
        customMetadata: options.customMetadata || {},
      });

      return {
        fileId: uploadResponse.fileId,
        name: uploadResponse.name,
        url: uploadResponse.url,
        thumbnailUrl: uploadResponse.thumbnailUrl,
        filePath: uploadResponse.filePath,
        size: uploadResponse.size,
        fileType: uploadResponse.fileType,
      };
    } catch (error) {
      this.logger.error('Error uploading image', error);
      throw new BadRequestException('Failed to upload image');
    }
  }

  /**
   * Multiple images upload
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    options: ImageUploadOptions = {},
  ) {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file, options),
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error('Error uploading multiple images', error);
      throw new BadRequestException('Failed to upload images');
    }
  }

  /**
   * Optimize and upload (resize, compress, convert format)
   */
  async optimizeAndUpload(
    file: Express.Multer.File,
    optimizeOptions: ImageOptimizeOptions = {},
    uploadOptions: ImageUploadOptions = {},
  ) {
    try {
      let sharpInstance = sharp(file.buffer);

      if (optimizeOptions.width || optimizeOptions.height) {
        sharpInstance = sharpInstance.resize(
          optimizeOptions.width,
          optimizeOptions.height,
          {
            fit: 'inside',
            withoutEnlargement: true,
          },
        );
      }

      const format = optimizeOptions.format || 'webp';
      const quality = optimizeOptions.quality || 80;

      switch (format) {
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality });
          break;
      }

      const optimizedBuffer = await sharpInstance.toBuffer();

      const optimizedFile: Express.Multer.File = {
        ...file,
        buffer: optimizedBuffer,
        originalname: file.originalname.replace(/\.[^.]+$/, `.${format}`),
      };

      return await this.uploadImage(optimizedFile, uploadOptions);
    } catch (error) {
      this.logger.error('Error optimizing image', error);
      throw new BadRequestException('Failed to optimize image');
    }
  }

  /**
   * Update image metadata
   */
  async updateImage(
    fileId: string,
    updates: {
      tags?: string[];
      customCoordinates?: string;
      customMetadata?: Record<string, any>;
    },
  ): Promise<any> { // Changed to explicit return type
    try {
      const response = await this.imagekit.updateFileDetails(fileId, updates);
      this.logger.log(`Image updated: ${fileId}`);
      return response;
    } catch (error) {
      this.logger.error('Error updating image', error);
      throw new BadRequestException('Failed to update image');
    }
  }

  /**
   * Delete single image
   */
  async deleteImage(fileId: string): Promise<void> {
    try {
      await this.imagekit.deleteFile(fileId);
    } catch (error) {
      this.logger.error('Error deleting image', error);
      throw new BadRequestException('Failed to delete image');
    }
  }

  /**
   * Delete multiple images
   */
  async deleteMultipleImages(fileIds: string[]): Promise<void> {
    try {
      const deletePromises = fileIds.map((fileId) =>
        this.imagekit.deleteFile(fileId),
      );
      await Promise.all(deletePromises);
      this.logger.log(`${fileIds.length} images deleted`);
    } catch (error) {
      this.logger.error('Error deleting multiple images', error);
      throw new BadRequestException('Failed to delete images');
    }
  }

  /**
   * Replace existing image
   */
  async replaceImage(
    oldFileId: string,
    newFile: Express.Multer.File,
    options: ImageUploadOptions = {},
  ) {
    try {
      const uploadResponse = await this.uploadImage(newFile, options);
      await this.deleteImage(oldFileId);
      this.logger.log(
        `Image replaced. Old: ${oldFileId}, New: ${uploadResponse.fileId}`,
      );
      return uploadResponse;
    } catch (error) {
      this.logger.error('Error replacing image', error);
      throw new BadRequestException('Failed to replace image');
    }
  }

  /**
   * Get image details
   */
  async getImageDetails(fileId: string): Promise<any> { // Changed to explicit return type
    try {
      return await this.imagekit.getFileDetails(fileId);
    } catch (error) {
      this.logger.error('Error fetching image details', error);
      throw new BadRequestException('Failed to fetch image details');
    }
  }

  /**
   * List files
   */
  async listFiles(searchQuery?: string, limit: number = 100): Promise<any> { // Changed to explicit return type
    try {
      return await this.imagekit.listFiles({ searchQuery, limit });
    } catch (error) {
      this.logger.error('Error listing files', error);
      throw new BadRequestException('Failed to list files');
    }
  }

  /**
   * Get optimized URL
   */
  getOptimizedUrl(
    filePath: string,
    transformations: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    } = {},
  ): string {
    const transformation: any = {};

    if (transformations.width) transformation.width = transformations.width;
    if (transformations.height) transformation.height = transformations.height;
    if (transformations.quality)
      transformation.quality = transformations.quality;
    if (transformations.format) transformation.format = transformations.format;

    return this.imagekit.url({
      path: filePath,
      transformation: [transformation],
    });
  }
}