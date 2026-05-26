import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { WarrantyEntity } from '../entities/warranty.entity';
import { CreateWarrantyDto, GetWarrantiesDto, UpdateWarrantyDto } from '../dto/warranty.dto';

@Injectable()
export class WarrantyService {
  constructor(
    @InjectRepository(WarrantyEntity)
    private readonly repo: Repository<WarrantyEntity>,
  ) {}

  async create(businessId: string, dto: CreateWarrantyDto) {
    const exists = await this.repo.findOne({ where: { businessId, name: ILike(dto.name) } });
    if (exists) throw new ConflictException('Warranty name already exists');
    return this.repo.save(this.repo.create({ ...dto, businessId }));
  }

  async findAll(businessId: string, query: GetWarrantiesDto) {
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
    const w = await this.repo.findOne({ where: { id, businessId } });
    if (!w) throw new NotFoundException('Warranty not found');
    return w;
  }

  async update(businessId: string, id: string, dto: UpdateWarrantyDto) {
    const w = await this.findOne(businessId, id);
    if (dto.name && dto.name !== w.name) {
      const conflict = await this.repo.findOne({ where: { businessId, name: ILike(dto.name) } });
      if (conflict) throw new ConflictException('Warranty name already exists');
    }
    Object.assign(w, dto);
    return this.repo.save(w);
  }

  async remove(businessId: string, id: string) {
    const w = await this.findOne(businessId, id);
    await this.repo.remove(w);
    return { message: 'Warranty deleted successfully' };
  }
}
