import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { CreateWarehouseDto, GetWarehousesDto, UpdateWarehouseDto } from '../dto/warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(WarehouseEntity)
    private readonly repo: Repository<WarehouseEntity>,
  ) {}

  async create(businessId: string, dto: CreateWarehouseDto) {
    const exists = await this.repo.findOne({ where: { businessId, name: ILike(dto.name) } });
    if (exists) throw new ConflictException('Warehouse name already exists');

    // If first warehouse or explicitly set as default, ensure only one default
    if (dto.isDefault) {
      await this.repo.update({ businessId }, { isDefault: false });
    }

    const count = await this.repo.count({ where: { businessId } });
    const isDefault = dto.isDefault ?? count === 0; // first warehouse is default

    const warehouse = this.repo.create({ ...dto, businessId, isDefault });
    return this.repo.save(warehouse);
  }

  async findAll(businessId: string, query: GetWarehousesDto) {
    const { search = '', page = 1, limit = 10 } = query;
    const where: any = { businessId };
    if (search) where.name = ILike(`%${search}%`);
    const [data, totalItems] = await this.repo.findAndCount({
      where,
      order: { isDefault: 'DESC', name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page), limit: Number(limit) } };
  }

  async findOne(businessId: string, id: string) {
    const w = await this.repo.findOne({ where: { id, businessId } });
    if (!w) throw new NotFoundException('Warehouse not found');
    return w;
  }

  async setDefault(businessId: string, id: string) {
    await this.findOne(businessId, id); // validate ownership
    await this.repo.update({ businessId }, { isDefault: false });
    await this.repo.update({ id, businessId }, { isDefault: true });
    return { message: 'Default warehouse updated' };
  }

  async update(businessId: string, id: string, dto: UpdateWarehouseDto) {
    const warehouse = await this.findOne(businessId, id);
    Object.assign(warehouse, dto);
    return this.repo.save(warehouse);
  }

  async remove(businessId: string, id: string) {
    const warehouse = await this.findOne(businessId, id);
    if (warehouse.isDefault) {
      throw new ConflictException('Cannot delete the default warehouse. Set another warehouse as default first.');
    }
    await this.repo.remove(warehouse);
    return { message: 'Warehouse deleted successfully' };
  }

  async getDefault(businessId: string): Promise<WarehouseEntity | null> {
    return this.repo.findOne({ where: { businessId, isDefault: true } });
  }
}
