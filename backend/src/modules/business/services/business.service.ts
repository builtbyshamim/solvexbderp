import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEntity } from '../entities/business.entity';
import { SetupBusinessDto } from '../dto/setup-business.dto';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UserRole } from 'src/common/shared/enums/user-role.enum';
import { AuthService } from 'src/modules/auth/services/auth.service';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepo: Repository<BusinessEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly authService: AuthService,
  ) {}

  async setup(user: UserEntity, dto: SetupBusinessDto) {
    const existing = await this.businessRepo.findOne({
      where: { ownerId: user.id },
    });
    if (existing) {
      throw new ConflictException('Business already set up for this account.');
    }

    const business = this.businessRepo.create({
      ...dto,
      ownerId: user.id,
      currencyCode: dto.currencyCode ?? 'BDT',
    });

    const saved = await this.businessRepo.save(business);

    // Promote user to admin role
    await this.userRepo.update(user.id, { role: UserRole.ADMIN });
    const updatedUser = { ...user, role: UserRole.ADMIN } as UserEntity;

    // Generate new tokens with businessId embedded so tenant context works
    const tokens = await this.authService.generateTokens(updatedUser, saved.id);

    return {
      message: 'Business setup complete',
      business: saved,
      ...tokens,
    };
  }

  async findByOwner(ownerId: string): Promise<BusinessEntity | null> {
    return this.businessRepo.findOne({ where: { ownerId } });
  }

  async findById(id: string): Promise<BusinessEntity> {
    const biz = await this.businessRepo.findOne({ where: { id } });
    if (!biz) throw new NotFoundException('Business not found');
    return biz;
  }

  async update(
    ownerId: string,
    dto: Partial<SetupBusinessDto>,
  ): Promise<BusinessEntity> {
    const biz = await this.businessRepo.findOne({ where: { ownerId } });
    if (!biz) throw new NotFoundException('Business not found');
    Object.assign(biz, dto);
    return this.businessRepo.save(biz);
  }
}
