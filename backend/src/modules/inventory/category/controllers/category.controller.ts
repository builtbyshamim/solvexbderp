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
import { CategoryService } from '../services/category.service';
import {
  CreateCategoryDto,
  GetCategoriesDto,
  UpdateCategoryDto,
} from '../dto/category.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { ImageKitService } from 'src/modules/image-upload/imagekit.service';

@ApiTags('Inventory - Categories')
@Controller({ path: 'inventory/categories', version: '1' })
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly imagekitService: ImageKitService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @BusinessId() businessId: string,
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const uploaded = await this.imagekitService.uploadImage(file, { folder: '/bizcore/categories' });
      dto.image = uploaded.url;
    }
    return this.categoryService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll(
    @BusinessId() businessId: string,
    @Query() query: GetCategoriesDto,
  ) {
    return this.categoryService.findAll(businessId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.categoryService.findOne(businessId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @BusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const uploaded = await this.imagekitService.uploadImage(file, { folder: '/bizcore/categories' });
      dto.image = uploaded.url;
    }
    return this.categoryService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  remove(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.categoryService.remove(businessId, id);
  }
}
