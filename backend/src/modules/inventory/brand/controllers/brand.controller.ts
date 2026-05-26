import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrandService } from '../services/brand.service';
import { CreateBrandDto, GetBrandsDto, UpdateBrandDto } from '../dto/brand.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { ImageKitService } from 'src/modules/image-upload/imagekit.service';

@ApiTags('Inventory - Brands')
@Controller({ path: 'inventory/brands', version: '1' })
export class BrandController {
  constructor(
    private readonly brandService: BrandService,
    private readonly imagekitService: ImageKitService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @BusinessId() businessId: string,
    @Body() dto: CreateBrandDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const uploaded = await this.imagekitService.uploadImage(file, { folder: '/bizcore/brands' });
      dto.logo = uploaded.url;
    }
    return this.brandService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  findAll(@BusinessId() businessId: string, @Query() query: GetBrandsDto) {
    return this.brandService.findAll(businessId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID' })
  findOne(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.brandService.findOne(businessId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a brand' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @BusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const uploaded = await this.imagekitService.uploadImage(file, { folder: '/bizcore/brands' });
      dto.logo = uploaded.url;
    }
    return this.brandService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a brand' })
  remove(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.brandService.remove(businessId, id);
  }
}
