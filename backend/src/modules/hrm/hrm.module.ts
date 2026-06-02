import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from './entities/employee.entity';
import { AttendanceEntity } from './entities/attendance.entity';
import { LeaveEntity } from './entities/leave.entity';
import { PayrollEntity } from './entities/payroll.entity';
import { DepartmentEntity } from './entities/department.entity';
import { DesignationEntity } from './entities/designation.entity';
import { LoanEntity } from './entities/loan.entity';
import { KpiEntity } from './entities/kpi.entity';
import { HrmService } from './services/hrm.service';
import { HrmController } from './controllers/hrm.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeEntity,
      AttendanceEntity,
      LeaveEntity,
      PayrollEntity,
      DepartmentEntity,
      DesignationEntity,
      LoanEntity,
      KpiEntity,
    ]),
  ],
  controllers: [HrmController],
  providers: [HrmService],
  exports: [HrmService],
})
export class HrmModule {}
