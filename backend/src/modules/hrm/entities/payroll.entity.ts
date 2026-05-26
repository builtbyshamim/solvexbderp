import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum PayrollStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  PAID = 'paid',
}

@Entity('payrolls')
export class PayrollEntity extends TenantBaseEntity {
  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  basicSalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  houseRent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  medicalAllowance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  transportAllowance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  otherAllowance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  grossSalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxDeduction: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  loanDeduction: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  otherDeduction: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDeduction: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netSalary: number;

  @Column({ type: 'int', default: 0, name: 'present_days' })
  presentDays: number;

  @Column({ type: 'int', default: 0, name: 'absent_days' })
  absentDays: number;

  @Column({ type: 'int', default: 0, name: 'leave_days' })
  leaveDays: number;

  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status: PayrollStatus;

  @Column({ nullable: true, name: 'paid_at' })
  paidAt?: Date;

  @Column({ nullable: true, name: 'paid_by' })
  paidBy?: string;

  @Column({ nullable: true })
  note?: string;
}
