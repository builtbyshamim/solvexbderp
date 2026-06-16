import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/modules/users/entities/user.entity';

export enum AffiliateStatus {
  PENDING   = 'pending',
  ACTIVE    = 'active',
  INACTIVE  = 'inactive',
  REJECTED  = 'rejected',
}

@Entity('affiliates')
export class AffiliateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'user_id', unique: true })
  userId: string;

  @ApiProperty({ enum: AffiliateStatus })
  @Column({ type: 'enum', enum: AffiliateStatus, default: AffiliateStatus.PENDING })
  status: AffiliateStatus;

  @ApiProperty({ example: 10.00 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.00 })
  commissionRate: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalEarned: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalPaid: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  bankName?: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  bankAccount?: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  bankAccountName?: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  mobileBank?: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  mobileBankNumber?: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
