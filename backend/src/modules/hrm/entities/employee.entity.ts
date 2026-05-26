import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
  ON_LEAVE = 'on_leave',
}

@Entity('employees')
export class EmployeeEntity extends TenantBaseEntity {
  @Column({ name: 'employee_code', unique: false })
  employeeCode: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  mobile?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  designation?: string;

  @Column({ type: 'date', name: 'joining_date' })
  joiningDate: Date;

  @Column({ type: 'enum', enum: EmploymentType, default: EmploymentType.FULL_TIME })
  employmentType: EmploymentType;

  @Column({ type: 'enum', enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  status: EmployeeStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  basicSalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  houseRent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  medicalAllowance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  transportAllowance: number;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true, name: 'national_id' })
  nationalId?: string;
}
