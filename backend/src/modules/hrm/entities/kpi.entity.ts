import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { EmployeeEntity } from './employee.entity';

@Entity('employee_kpis')
export class KpiEntity extends TenantBaseEntity {
  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'employee_id' })
  employee?: EmployeeEntity;

  @Column()
  period: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  rating: number;

  @Column({ nullable: true })
  comment?: string;

  @Column({ nullable: true, name: 'evaluated_by' })
  evaluatedBy?: string;
}
