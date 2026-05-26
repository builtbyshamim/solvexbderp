import {
  Body, Controller, Delete, Get, Param,
  Patch, Post, Query, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { CreateProductDto, GetProductsDto, UpdateProductDto } from '../dto/product.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ImageKitService } from 'src/modules/image-upload/imagekit.service';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('Inventory - Products')
@Controller({ path: 'inventory/products', version: '1' })
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly imagekitService: ImageKitService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @BusinessId() businessId: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const uploaded = await this.imagekitService.uploadImage(file, { folder: '/bizcore/products' });
      dto.image = uploaded.url;
    }
    return this.productService.create(businessId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  findAll(@BusinessId() businessId: string, @Query() query: GetProductsDto) {
    return this.productService.findAll(businessId, query);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock products' })
  getLowStock(@BusinessId() businessId: string) {
    return this.productService.getLowStockProducts(businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.productService.findOne(businessId, id);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get stock levels per warehouse' })
  getStock(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.productService.getStock(businessId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @BusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const uploaded = await this.imagekitService.uploadImage(file, { folder: '/bizcore/products' });
      dto.image = uploaded.url;
    }
    return this.productService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  remove(@BusinessId() businessId: string, @Param('id') id: string) {
    return this.productService.remove(businessId, id);
  }
}
