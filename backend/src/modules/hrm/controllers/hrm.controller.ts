import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HrmService } from '../services/hrm.service';
import {
  CreateAttendanceDto, CreateEmployeeDto, CreateLeaveDto, GeneratePayrollDto,
  GetAttendanceDto, GetEmployeesDto, GetLeavesDto, GetPayrollsDto,
  UpdateEmployeeDto, UpdateLeaveStatusDto,
} from '../dto/hrm.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('HRM')
@Controller({ path: 'hrm', version: '1' })
export class HrmController {
  constructor(private readonly hrmService: HrmService) {}

  // ── Employees ──
  @Post('employees')
  @ApiOperation({ summary: 'Create employee' })
  createEmployee(@BusinessId() biz: string, @Body() dto: CreateEmployeeDto) {
    return this.hrmService.createEmployee(biz, dto);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get all employees' })
  getEmployees(@BusinessId() biz: string, @Query() q: GetEmployeesDto) {
    return this.hrmService.findAllEmployees(biz, q);
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by ID' })
  getEmployee(@BusinessId() biz: string, @Param('id') id: string) {
    return this.hrmService.findEmployee(biz, id);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Update employee' })
  updateEmployee(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.hrmService.updateEmployee(biz, id, dto);
  }

  @Delete('employees/:id')
  @ApiOperation({ summary: 'Terminate employee' })
  deleteEmployee(@BusinessId() biz: string, @Param('id') id: string) {
    return this.hrmService.deleteEmployee(biz, id);
  }

  // ── Attendance ──
  @Post('attendance')
  @ApiOperation({ summary: 'Record attendance' })
  createAttendance(@BusinessId() biz: string, @Body() dto: CreateAttendanceDto) {
    return this.hrmService.createAttendance(biz, dto);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance records' })
  getAttendance(@BusinessId() biz: string, @Query() q: GetAttendanceDto) {
    return this.hrmService.findAttendance(biz, q);
  }

  @Get('attendance/summary/:employeeId')
  @ApiOperation({ summary: 'Monthly attendance summary for an employee' })
  getAttendanceSummary(
    @BusinessId() biz: string,
    @Param('employeeId') empId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.hrmService.getAttendanceSummary(biz, empId, Number(month), Number(year));
  }

  // ── Leave ──
  @Post('leaves')
  @ApiOperation({ summary: 'Submit leave request' })
  createLeave(@BusinessId() biz: string, @Body() dto: CreateLeaveDto) {
    return this.hrmService.createLeave(biz, dto);
  }

  @Get('leaves')
  @ApiOperation({ summary: 'Get all leave requests' })
  getLeaves(@BusinessId() biz: string, @Query() q: GetLeavesDto) {
    return this.hrmService.findLeaves(biz, q);
  }

  @Patch('leaves/:id/status')
  @ApiOperation({ summary: 'Approve or reject leave' })
  updateLeaveStatus(
    @BusinessId() biz: string,
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateLeaveStatusDto,
  ) {
    return this.hrmService.updateLeaveStatus(biz, id, user.id, dto);
  }

  // ── Payroll ──
  @Post('payroll/generate')
  @ApiOperation({ summary: 'Generate payroll for employee/month' })
  generatePayroll(
    @BusinessId() biz: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: GeneratePayrollDto,
  ) {
    return this.hrmService.generatePayroll(biz, user.id, dto);
  }

  @Get('payroll')
  @ApiOperation({ summary: 'Get payroll records' })
  getPayrolls(@BusinessId() biz: string, @Query() q: GetPayrollsDto) {
    return this.hrmService.findPayrolls(biz, q);
  }

  @Patch('payroll/:id/approve')
  @ApiOperation({ summary: 'Approve payroll' })
  approvePayroll(@BusinessId() biz: string, @Param('id') id: string) {
    return this.hrmService.approvePayroll(biz, id);
  }

  @Patch('payroll/:id/pay')
  @ApiOperation({ summary: 'Mark payroll as paid' })
  markPaid(
    @BusinessId() biz: string,
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.hrmService.markPayrollPaid(biz, id, user.id);
  }
}
