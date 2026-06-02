import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { BrandEntity } from '../entities/brand.entity';
import { CreateBrandDto, GetBrandsDto, UpdateBrandDto } from '../dto/brand.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly repo: Repository<BrandEntity>,
  ) {}

  async create(businessId: string, dto: CreateBrandDto) {
    const exists = await this.repo.findOne({ where: { businessId, name: ILike(dto.name) } });
    if (exists) throw new ConflictException('Brand name already exists');
    return this.repo.save(this.repo.create({ ...dto, businessId }));
  }

  async findAll(businessId: string, query: GetBrandsDto) {
    const { search = '', page = 1, limit = 10 } = query;
    const where: any = { businessId };
    if (search) where.name = ILike(`%${search}%`);
    const [data, totalItems] = await this.repo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page), limit: Number(limit) } };
  }

  async findOne(businessId: string, id: string) {
    const brand = await this.repo.findOne({ where: { id, businessId } });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async update(businessId: string, id: string, dto: UpdateBrandDto) {
    const brand = await this.findOne(businessId, id);
    if (dto.name && dto.name !== brand.name) {
      const conflict = await this.repo.findOne({ where: { businessId, name: ILike(dto.name) } });
      if (conflict) throw new ConflictException('Brand name already exists');
    }
    // Normalize status alias → isActive
    const { status, ...rest } = dto as any;
    if (status !== undefined && rest.isActive === undefined) {
      rest.isActive = status;
    }
    Object.assign(brand, rest);
    return this.repo.save(brand);
  }

  async remove(businessId: string, id: string) {
    const brand = await this.findOne(businessId, id);
    await this.repo.remove(brand);
    return { message: 'Brand deleted successfully' };
  }
}
