import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

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
