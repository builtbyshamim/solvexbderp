import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/modules/users/entities/user.entity';

export enum BusinessType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  RESTAURANT = 'restaurant',
  SERVICE = 'service',
  MANUFACTURING = 'manufacturing',
  OTHER = 'other',
}

@Entity('businesses')
export class BusinessEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ enum: BusinessType })
  @Column({ type: 'enum', enum: BusinessType, default: BusinessType.RETAIL })
  businessType: BusinessType;

  @ApiProperty()
  @Column({ nullable: true })
  address?: string;

  @ApiProperty()
  @Column({ nullable: true })
  phone?: string;

  @ApiProperty()
  @Column({ nullable: true })
  email?: string;

  @ApiProperty()
  @Column({ nullable: true })
  website?: string;

  @ApiProperty()
  @Column({ nullable: true })
  logo?: string;

  @ApiProperty()
  @Column({ nullable: true })
  taxNumber?: string;

  @ApiProperty()
  @Column({ nullable: true })
  currency?: string;

  @ApiProperty()
  @Column({ default: 'BDT' })
  currencyCode: string;

  @ApiProperty()
  @Column({ default: 'Asia/Dhaka' })
  timezone: string;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ default: 'trial' })
  subscriptionStatus: string; // 'trial' | 'active' | 'expired' | 'suspended'

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  subscriptionExpiresAt: Date | null;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  subscriptionPlan: string | null; // 'starter' | 'pro' | 'enterprise'

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  packageId: string | null;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date | null;

  @ApiProperty()
  @Column({ type: 'varchar', default: 'monthly' })
  billingCycle: string; // 'monthly' | 'yearly'

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
