import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/shared/enums/user-role.enum';
import { RefreshTokenEntity } from 'src/modules/auth/entities/refresh-token.entity';
@Entity('users')
@Index(['email', 'mobile'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: '01214745841' })
  @Column({ unique: true, nullable: true })
  mobile: string;

  @ApiProperty({ example: 'Md. Shamim Hossain' })
  @Column({ type: 'varchar', nullable: true })
  name?: string;

  @ApiProperty({ example: 'Dhaka, Bangladesh' })
  @Column({ type: 'varchar', nullable: true })
  address?: string;

  @ApiProperty({ example: 'Dhaka, Bangladesh' })
  @Column({ type: 'boolean', nullable: true, default: false })
  isVerified?: boolean;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({ example: 'hashedpassword' })
  @Column({ type: 'varchar', nullable: true })
  password: string;

  @ApiProperty({ example: 'https://example.com' })
  @Column({ type: 'varchar', nullable: true })
  avatar: string;

  @ApiProperty({ example: 'Dhaka, Bangladesh' })
  @Column({ type: 'boolean', nullable: true, default: false })
  isBanned?: boolean;

  @ApiProperty({ example: 'REF12345' })
  @Column({ type: 'varchar', unique: true, nullable: true })
  referralCode: string;

  @ApiProperty({ example: 'REF87654' })
  @Column({ type: 'varchar', nullable: true })
  referredBy?: string;

  // MLM Tree Parent
  @Column({ nullable: true })
  parentId: string;

  // left or right position
  @Column({
    type: 'enum',
    enum: ['left', 'right'],
    nullable: true,
  })
  position: 'left' | 'right';

  // left child
  @Column({ nullable: true })
  leftChild: string;

  // right child
  @Column({ nullable: true })
  rightChild: string;

  @Column({ default: 0 })
  referralCount: number;

  @ApiProperty({ example: 'Dhaka, Bangladesh' })
  @Column({ type: 'boolean', nullable: true, default: false })
  isDeleted?: boolean;

  @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshTokenEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
