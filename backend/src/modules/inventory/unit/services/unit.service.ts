import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UnitEntity } from '../entities/unit.entity';
import { CreateUnitDto, GetUnitsDto, UpdateUnitDto } from '../dto/unit.dto';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly repo: Repository<UnitEntity>,
  ) {}

  async create(businessId: string, dto: CreateUnitDto) {
    const exists = await this.repo.findOne({
      where: { businessId, name: ILike(dto.name) },
    });
    if (exists) throw new ConflictException('Unit name already exists');

    const unit = this.repo.create({ ...dto, businessId });
    return this.repo.save(unit);
  }

  async findAll(businessId: string, query: GetUnitsDto) {
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
    const unit = await this.repo.findOne({ where: { id, businessId } });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async update(businessId: string, id: string, dto: UpdateUnitDto) {
    const unit = await this.findOne(businessId, id);

    if (dto.name && dto.name !== unit.name) {
      const conflict = await this.repo.findOne({
        where: { businessId, name: ILike(dto.name) },
      });
      if (conflict) throw new ConflictException('Unit name already exists');
    }

    Object.assign(unit, dto);
    return this.repo.save(unit);
  }

  async remove(businessId: string, id: string) {
    const unit = await this.findOne(businessId, id);
    await this.repo.remove(unit);
    return { message: 'Unit deleted successfully' };
  }
}
