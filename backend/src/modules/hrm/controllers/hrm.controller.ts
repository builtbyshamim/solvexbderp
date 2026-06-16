import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HrmService } from '../services/hrm.service';
import {
  CreateAttendanceDto, CreateEmployeeDto, CreateLeaveDto, GeneratePayrollDto,
  GetAttendanceDto, GetEmployeesDto, GetLeavesDto, GetPayrollsDto,
  UpdateEmployeeDto, UpdateLeaveStatusDto,
  CreateDepartmentDto, UpdateDepartmentDto,
  CreateDesignationDto, UpdateDesignationDto,
  CreateLoanDto, UpdateLoanDto,
  CreateKpiDto,
} from '../dto/hrm.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/modules/users/entities/user.entity';

@ApiTags('HRM')
@Controller({ path: 'hrm', version: '1' })
export class HrmController {
  constructor(private readonly hrmService: HrmService) {}

  // ── Employees ──────────────────────────────────────────────────────────────

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

  // ── Departments ────────────────────────────────────────────────────────────

  @Post('departments')
  @ApiOperation({ summary: 'Create department' })
  createDepartment(@BusinessId() biz: string, @Body() dto: CreateDepartmentDto) {
    return this.hrmService.createDepartment(biz, dto);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Get all departments' })
  getDepartments(@BusinessId() biz: string) {
    return this.hrmService.findAllDepartments(biz);
  }

  @Patch('departments/:id')
  @ApiOperation({ summary: 'Update department' })
  updateDepartment(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.hrmService.updateDepartment(biz, id, dto);
  }

  @Delete('departments/:id')
  @ApiOperation({ summary: 'Delete department' })
  deleteDepartment(@BusinessId() biz: string, @Param('id') id: string) {
    return this.hrmService.deleteDepartment(biz, id);
  }

  // ── Designations ───────────────────────────────────────────────────────────

  @Post('designations')
  @ApiOperation({ summary: 'Create designation' })
  createDesignation(@BusinessId() biz: string, @Body() dto: CreateDesignationDto) {
    return this.hrmService.createDesignation(biz, dto);
  }

  @Get('designations')
  @ApiOperation({ summary: 'Get all designations' })
  getDesignations(@BusinessId() biz: string) {
    return this.hrmService.findAllDesignations(biz);
  }

  @Patch('designations/:id')
  @ApiOperation({ summary: 'Update designation' })
  updateDesignation(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateDesignationDto) {
    return this.hrmService.updateDesignation(biz, id, dto);
  }

  @Delete('designations/:id')
  @ApiOperation({ summary: 'Delete designation' })
  deleteDesignation(@BusinessId() biz: string, @Param('id') id: string) {
    return this.hrmService.deleteDesignation(biz, id);
  }

  // ── Attendance ─────────────────────────────────────────────────────────────

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

  // ── Leave ──────────────────────────────────────────────────────────────────

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

  // ── Payroll ────────────────────────────────────────────────────────────────

  @Post('payroll/generate')
  @ApiOperation({ summary: 'Generate payroll for employee/month' })
  generatePayroll(@BusinessId() biz: string, @CurrentUser() user: UserEntity, @Body() dto: GeneratePayrollDto) {
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
  markPaid(@BusinessId() biz: string, @Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.hrmService.markPayrollPaid(biz, id, user.id);
  }

  // ── Loans ──────────────────────────────────────────────────────────────────

  @Post('loans')
  @ApiOperation({ summary: 'Create loan/advance' })
  createLoan(@BusinessId() biz: string, @Body() dto: CreateLoanDto) {
    return this.hrmService.createLoan(biz, dto);
  }

  @Get('loans')
  @ApiOperation({ summary: 'Get all loans' })
  getLoans(
    @BusinessId() biz: string,
    @Query('employeeId') employeeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.hrmService.findLoans(biz, { employeeId, page, limit });
  }

  @Patch('loans/:id')
  @ApiOperation({ summary: 'Update loan' })
  updateLoan(@BusinessId() biz: string, @Param('id') id: string, @Body() dto: UpdateLoanDto) {
    return this.hrmService.updateLoan(biz, id, dto);
  }

  // ── KPI ────────────────────────────────────────────────────────────────────

  @Post('kpi')
  @ApiOperation({ summary: 'Create KPI evaluation' })
  createKpi(@BusinessId() biz: string, @CurrentUser() user: UserEntity, @Body() dto: CreateKpiDto) {
    return this.hrmService.createKpi(biz, user.id, dto);
  }

  @Get('kpi')
  @ApiOperation({ summary: 'Get all KPI evaluations' })
  getKpis(
    @BusinessId() biz: string,
    @Query('employeeId') employeeId?: string,
    @Query('year') year?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.hrmService.findKpis(biz, { employeeId, year, page, limit });
  }
}
