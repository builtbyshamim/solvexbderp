import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  CASUAL = 'casual',
  MATERNITY = 'maternity',
  UNPAID = 'unpaid',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('leaves')
export class LeaveEntity extends TenantBaseEntity {
  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'enum', enum: LeaveType })
  leaveType: LeaveType;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'int' })
  totalDays: number;

  @Column({ nullable: true })
  reason?: string;

  @Column({ type: 'enum', enum: LeaveStatus, default: LeaveStatus.PENDING })
  status: LeaveStatus;

  @Column({ nullable: true, name: 'approved_by' })
  approvedBy?: string;

  @Column({ nullable: true, name: 'rejection_reason' })
  rejectionReason?: string;
}
