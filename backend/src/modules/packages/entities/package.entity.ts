import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('packages')
export class PackageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'varchar' })
  badge: string | null;

  @Column({ default: false })
  highlight: boolean;

  @Column({ default: false })
  isEnterprise: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  yearlyPrice: number;

  @Column({ default: 15 })
  trialDays: number;

  @Column({ default: -1 })
  maxUsers: number;

  @Column({ default: -1 })
  maxProducts: number;

  @Column({ default: -1 })
  maxWarehouses: number;

  @Column({ type: 'json', default: [] })
  features: string[];

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
