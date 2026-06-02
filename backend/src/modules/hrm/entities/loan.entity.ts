import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { EmployeeEntity } from './employee.entity';

export enum LoanStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum LoanType {
  LOAN = 'loan',
  ADVANCE = 'advance',
}

@Entity('employee_loans')
export class LoanEntity extends TenantBaseEntity {
  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'employee_id' })
  employee?: EmployeeEntity;

  @Column({ type: 'enum', enum: LoanType, default: LoanType.LOAN })
  loanType: LoanType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  remainingAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'monthly_installment' })
  monthlyInstallment: number;

  @Column({ type: 'date', name: 'issue_date' })
  issueDate: Date;

  @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.ACTIVE })
  status: LoanStatus;

  @Column({ nullable: true })
  note?: string;
}
