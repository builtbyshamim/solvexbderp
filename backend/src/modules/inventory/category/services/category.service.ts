import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import {
  CreateCategoryDto,
  GetCategoriesDto,
  UpdateCategoryDto,
} from '../dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repo: Repository<CategoryEntity>,
  ) {}

  async create(businessId: string, dto: CreateCategoryDto) {
    const exists = await this.repo.findOne({
      where: { businessId, name: ILike(dto.name) },
    });
    if (exists) throw new ConflictException('Category name already exists');

    const category = this.repo.create({ ...dto, businessId });
    return this.repo.save(category);
  }

  async findAll(businessId: string, query: GetCategoriesDto) {
    const { search = '', page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (search) where.name = ILike(`%${search}%`);

    const [data, totalItems] = await this.repo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    };
  }

  async findOne(businessId: string, id: string) {
    const cat = await this.repo.findOne({ where: { id, businessId } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(businessId: string, id: string, dto: UpdateCategoryDto) {
    const cat = await this.findOne(businessId, id);

    if (dto.name && dto.name !== cat.name) {
      const conflict = await this.repo.findOne({
        where: { businessId, name: ILike(dto.name) },
      });
      if (conflict) throw new ConflictException('Category name already exists');
    }

    Object.assign(cat, dto);
    return this.repo.save(cat);
  }

  async remove(businessId: string, id: string) {
    const cat = await this.findOne(businessId, id);
    await this.repo.remove(cat);
    return { message: 'Category deleted successfully' };
  }
}
