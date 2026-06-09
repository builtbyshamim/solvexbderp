import {
  BadRequestException,
  Body, Controller, Delete, Get, Param,
  Patch, Post, Query, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { ProductImportExportService } from '../services/product-import-export.service';
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
    private readonly importExportService: ProductImportExportService,
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

  @Get('export')
  @ApiOperation({ summary: 'Export all products as Excel (.xlsx)' })
  async exportProducts(@BusinessId() businessId: string, @Res() res: any) {
    const buffer = await this.importExportService.exportProducts(businessId);
    res.setHeader('Content-Disposition', 'attachment; filename="products.xlsx"');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  @Get('import-template')
  @ApiOperation({ summary: 'Download the product import template (.xlsx)' })
  getImportTemplate(@Res() res: any) {
    const buffer = this.importExportService.getTemplate();
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="product-import-template.xlsx"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import products from Excel or CSV file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(
    @BusinessId() businessId: string,
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Please upload an Excel or CSV file');
    return this.importExportService.importProducts(businessId, user.id, file);
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
