import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { EmployeeEntity } from './employee.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  HALF_DAY = 'half_day',
  LATE = 'late',
  HOLIDAY = 'holiday',
  LEAVE = 'leave',
}

@Entity('attendances')
@Index(['businessId', 'employeeId', 'date'])
export class AttendanceEntity extends TenantBaseEntity {
  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'employee_id' })
  employee?: EmployeeEntity;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true, name: 'check_in' })
  checkIn?: string;

  @Column({ nullable: true, name: 'check_out' })
  checkOut?: string;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @Column({ nullable: true })
  note?: string;
}
