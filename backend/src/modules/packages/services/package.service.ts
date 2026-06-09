import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackageEntity } from '../entities/package.entity';
import { CreatePackageDto, UpdatePackageDto } from '../dto/package.dto';

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(PackageEntity)
    private readonly packageRepo: Repository<PackageEntity>,
  ) {}

  getPublic() {
    return this.packageRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  getAll() {
    return this.packageRepo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async findById(id: string) {
    const pkg = await this.packageRepo.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  create(dto: CreatePackageDto) {
    const pkg = this.packageRepo.create({
      ...dto,
      highlight: dto.highlight ?? false,
      isEnterprise: dto.isEnterprise ?? false,
      isActive: dto.isActive ?? true,
      trialDays: dto.trialDays ?? 15,
      maxUsers: dto.maxUsers ?? -1,
      maxProducts: dto.maxProducts ?? -1,
      maxWarehouses: dto.maxWarehouses ?? -1,
      features: dto.features ?? [],
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.packageRepo.save(pkg);
  }

  async update(id: string, dto: UpdatePackageDto) {
    const pkg = await this.findById(id);
    Object.assign(pkg, dto);
    return this.packageRepo.save(pkg);
  }

  async remove(id: string) {
    const pkg = await this.findById(id);
    await this.packageRepo.remove(pkg);
    return { message: 'Package deleted' };
  }
}
