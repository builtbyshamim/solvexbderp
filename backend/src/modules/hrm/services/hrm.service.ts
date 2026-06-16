import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, Between } from 'typeorm';
import { EmployeeEntity, EmployeeStatus } from '../entities/employee.entity';
import { AttendanceEntity, AttendanceStatus } from '../entities/attendance.entity';
import { LeaveEntity, LeaveStatus } from '../entities/leave.entity';
import { PayrollEntity, PayrollStatus } from '../entities/payroll.entity';
import { DepartmentEntity } from '../entities/department.entity';
import { DesignationEntity } from '../entities/designation.entity';
import { LoanEntity, LoanStatus, LoanType } from '../entities/loan.entity';
import { KpiEntity } from '../entities/kpi.entity';
import {
  CreateAttendanceDto, CreateEmployeeDto, CreateLeaveDto, GeneratePayrollDto,
  GetAttendanceDto, GetEmployeesDto, GetLeavesDto, GetPayrollsDto,
  UpdateEmployeeDto, UpdateLeaveStatusDto,
  CreateDepartmentDto, UpdateDepartmentDto,
  CreateDesignationDto, UpdateDesignationDto,
  CreateLoanDto, UpdateLoanDto,
  CreateKpiDto,
} from '../dto/hrm.dto';

@Injectable()
export class HrmService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(LeaveEntity)
    private readonly leaveRepo: Repository<LeaveEntity>,
    @InjectRepository(PayrollEntity)
    private readonly payrollRepo: Repository<PayrollEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly deptRepo: Repository<DepartmentEntity>,
    @InjectRepository(DesignationEntity)
    private readonly desigRepo: Repository<DesignationEntity>,
    @InjectRepository(LoanEntity)
    private readonly loanRepo: Repository<LoanEntity>,
    @InjectRepository(KpiEntity)
    private readonly kpiRepo: Repository<KpiEntity>,
  ) {}

  // ─── Employees ────────────────────────────────────────────────────────────

  private async generateEmployeeCode(businessId: string): Promise<string> {
    const count = await this.employeeRepo.count({ where: { businessId } });
    return `EMP-${String(count + 1).padStart(4, '0')}`;
  }

  async createEmployee(businessId: string, dto: CreateEmployeeDto) {
    const employeeCode = await this.generateEmployeeCode(businessId);
    const employee = this.employeeRepo.create({
      ...dto, businessId, employeeCode,
      joiningDate: new Date(dto.joiningDate),
      basicSalary: dto.basicSalary ?? 0,
      houseRent: dto.houseRent ?? 0,
      medicalAllowance: dto.medicalAllowance ?? 0,
      transportAllowance: dto.transportAllowance ?? 0,
    });
    return this.employeeRepo.save(employee);
  }

  async findAllEmployees(businessId: string, query: GetEmployeesDto) {
    const { search = '', page = 1, limit = 10, department, status } = query;
    const where: any = { businessId };
    if (search) where.name = ILike(`%${search}%`);
    if (department) where.department = department;
    if (status) where.status = status;

    const [data, totalItems] = await this.employeeRepo.findAndCount({
      where, order: { name: 'ASC' },
      skip: (page - 1) * limit, take: limit,
    });
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async findEmployee(businessId: string, id: string) {
    const e = await this.employeeRepo.findOne({ where: { id, businessId } });
    if (!e) throw new NotFoundException('Employee not found');
    return e;
  }

  async updateEmployee(businessId: string, id: string, dto: UpdateEmployeeDto) {
    const e = await this.findEmployee(businessId, id);
    Object.assign(e, dto);
    return this.employeeRepo.save(e);
  }

  async deleteEmployee(businessId: string, id: string) {
    const e = await this.findEmployee(businessId, id);
    e.status = EmployeeStatus.TERMINATED;
    await this.employeeRepo.save(e);
    return { message: 'Employee terminated' };
  }

  // ─── Departments ──────────────────────────────────────────────────────────

  async createDepartment(businessId: string, dto: CreateDepartmentDto) {
    const exists = await this.deptRepo.findOne({ where: { businessId, name: ILike(dto.name) } });
    if (exists) throw new ConflictException('Department already exists');
    return this.deptRepo.save(this.deptRepo.create({ ...dto, businessId }));
  }

  async findAllDepartments(businessId: string) {
    return this.deptRepo.find({ where: { businessId }, order: { name: 'ASC' } });
  }

  async updateDepartment(businessId: string, id: string, dto: UpdateDepartmentDto) {
    const d = await this.deptRepo.findOne({ where: { id, businessId } });
    if (!d) throw new NotFoundException('Department not found');
    Object.assign(d, dto);
    return this.deptRepo.save(d);
  }

  async deleteDepartment(businessId: string, id: string) {
    const d = await this.deptRepo.findOne({ where: { id, businessId } });
    if (!d) throw new NotFoundException('Department not found');
    await this.deptRepo.remove(d);
    return { message: 'Department deleted' };
  }

  // ─── Designations ─────────────────────────────────────────────────────────

  async createDesignation(businessId: string, dto: CreateDesignationDto) {
    const exists = await this.desigRepo.findOne({ where: { businessId, name: ILike(dto.name) } });
    if (exists) throw new ConflictException('Designation already exists');
    return this.desigRepo.save(this.desigRepo.create({ ...dto, businessId }));
  }

  async findAllDesignations(businessId: string) {
    return this.desigRepo.find({ where: { businessId }, order: { name: 'ASC' } });
  }

  async updateDesignation(businessId: string, id: string, dto: UpdateDesignationDto) {
    const d = await this.desigRepo.findOne({ where: { id, businessId } });
    if (!d) throw new NotFoundException('Designation not found');
    Object.assign(d, dto);
    return this.desigRepo.save(d);
  }

  async deleteDesignation(businessId: string, id: string) {
    const d = await this.desigRepo.findOne({ where: { id, businessId } });
    if (!d) throw new NotFoundException('Designation not found');
    await this.desigRepo.remove(d);
    return { message: 'Designation deleted' };
  }

  // ─── Attendance ───────────────────────────────────────────────────────────

  async createAttendance(businessId: string, dto: CreateAttendanceDto) {
    const existing = await this.attendanceRepo.findOne({
      where: { businessId, employeeId: dto.employeeId, date: new Date(dto.date) as any },
    });
    if (existing) throw new ConflictException('Attendance already recorded for this date');
    return this.attendanceRepo.save({
      ...dto, businessId, date: new Date(dto.date),
      status: dto.status ?? AttendanceStatus.PRESENT,
    });
  }

  async findAttendance(businessId: string, query: GetAttendanceDto) {
    const { employeeId, dateFrom, dateTo, page = 1, limit = 31 } = query;
    const qb = this.attendanceRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.employee', 'employee')
      .where('a.businessId = :businessId', { businessId });

    if (employeeId) qb.andWhere('a.employeeId = :employeeId', { employeeId });
    if (dateFrom && dateTo) {
      qb.andWhere('a.date BETWEEN :from AND :to', { from: new Date(dateFrom), to: new Date(dateTo) });
    } else if (dateFrom) {
      qb.andWhere('a.date = :date', { date: new Date(dateFrom) });
    }

    qb.orderBy('a.date', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async getAttendanceSummary(businessId: string, employeeId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const records = await this.attendanceRepo.find({
      where: { businessId, employeeId, date: Between(start, end) as any },
    });
    const summary = { present: 0, absent: 0, halfDay: 0, late: 0, leave: 0, holiday: 0 };
    for (const r of records) {
      if (r.status === AttendanceStatus.PRESENT) summary.present++;
      else if (r.status === AttendanceStatus.ABSENT) summary.absent++;
      else if (r.status === AttendanceStatus.HALF_DAY) summary.halfDay++;
      else if (r.status === AttendanceStatus.LATE) summary.late++;
      else if (r.status === AttendanceStatus.LEAVE) summary.leave++;
      else if (r.status === AttendanceStatus.HOLIDAY) summary.holiday++;
    }
    return summary;
  }

  // ─── Leave ────────────────────────────────────────────────────────────────

  async createLeave(businessId: string, dto: CreateLeaveDto) {
    await this.findEmployee(businessId, dto.employeeId);
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException('End date must be after start date');
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return this.leaveRepo.save({ ...dto, businessId, startDate: start, endDate: end, totalDays });
  }

  async findLeaves(businessId: string, query: GetLeavesDto) {
    const { employeeId, status, page = 1, limit = 10 } = query;
    const qb = this.leaveRepo.createQueryBuilder('l')
      .leftJoinAndSelect('l.employee', 'employee')
      .where('l.businessId = :businessId', { businessId });

    if (employeeId) qb.andWhere('l.employeeId = :employeeId', { employeeId });
    if (status) qb.andWhere('l.status = :status', { status });
    qb.orderBy('l.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async updateLeaveStatus(businessId: string, id: string, userId: string, dto: UpdateLeaveStatusDto) {
    const leave = await this.leaveRepo.findOne({ where: { id, businessId } });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status !== LeaveStatus.PENDING) throw new BadRequestException('Leave is already processed');
    leave.status = dto.status === 'approved' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;
    leave.approvedBy = userId;
    if (dto.rejectionReason) leave.rejectionReason = dto.rejectionReason;
    return this.leaveRepo.save(leave);
  }

  // ─── Payroll ──────────────────────────────────────────────────────────────

  async generatePayroll(businessId: string, userId: string, dto: GeneratePayrollDto) {
    const employee = await this.findEmployee(businessId, dto.employeeId);
    const existing = await this.payrollRepo.findOne({
      where: { businessId, employeeId: dto.employeeId, month: dto.month, year: dto.year },
    });
    if (existing) throw new ConflictException('Payroll already generated for this period');

    const summary = await this.getAttendanceSummary(businessId, dto.employeeId, dto.month, dto.year);

    const grossSalary = Number(employee.basicSalary) + Number(employee.houseRent) +
      Number(employee.medicalAllowance) + Number(employee.transportAllowance) +
      (dto.otherAllowance ?? 0);
    const totalDeduction = (dto.taxDeduction ?? 0) + (dto.loanDeduction ?? 0) + (dto.otherDeduction ?? 0);
    const netSalary = grossSalary - totalDeduction;

    return this.payrollRepo.save({
      businessId, employeeId: dto.employeeId,
      month: dto.month, year: dto.year,
      basicSalary: employee.basicSalary, houseRent: employee.houseRent,
      medicalAllowance: employee.medicalAllowance, transportAllowance: employee.transportAllowance,
      otherAllowance: dto.otherAllowance ?? 0,
      grossSalary, taxDeduction: dto.taxDeduction ?? 0, loanDeduction: dto.loanDeduction ?? 0,
      otherDeduction: dto.otherDeduction ?? 0, totalDeduction, netSalary,
      presentDays: summary.present + summary.late, absentDays: summary.absent, leaveDays: summary.leave,
      status: PayrollStatus.DRAFT, note: dto.note,
    });
  }

  async findPayrolls(businessId: string, query: GetPayrollsDto) {
    const { employeeId, month, year, status, page = 1, limit = 10 } = query;
    const qb = this.payrollRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.employee', 'employee')
      .where('p.businessId = :businessId', { businessId });

    if (employeeId) qb.andWhere('p.employeeId = :employeeId', { employeeId });
    if (month) qb.andWhere('p.month = :month', { month });
    if (year) qb.andWhere('p.year = :year', { year });
    if (status) qb.andWhere('p.status = :status', { status });
    qb.orderBy('p.year', 'DESC').addOrderBy('p.month', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async approvePayroll(businessId: string, id: string) {
    const p = await this.payrollRepo.findOne({ where: { id, businessId } });
    if (!p) throw new NotFoundException('Payroll not found');
    if (p.status !== PayrollStatus.DRAFT) throw new BadRequestException('Only draft payrolls can be approved');
    p.status = PayrollStatus.APPROVED;
    return this.payrollRepo.save(p);
  }

  async markPayrollPaid(businessId: string, id: string, userId: string) {
    const p = await this.payrollRepo.findOne({ where: { id, businessId } });
    if (!p) throw new NotFoundException('Payroll not found');
    if (p.status !== PayrollStatus.APPROVED) throw new BadRequestException('Payroll must be approved before marking as paid');
    p.status = PayrollStatus.PAID;
    p.paidAt = new Date();
    p.paidBy = userId;
    return this.payrollRepo.save(p);
  }

  // ─── Loans ────────────────────────────────────────────────────────────────

  async createLoan(businessId: string, dto: CreateLoanDto) {
    await this.findEmployee(businessId, dto.employeeId);
    return this.loanRepo.save(this.loanRepo.create({
      ...dto,
      businessId,
      loanType: dto.loanType ?? LoanType.LOAN,
      remainingAmount: dto.amount,
      issueDate: new Date(dto.issueDate),
      monthlyInstallment: dto.monthlyInstallment ?? 0,
    }));
  }

  async findLoans(businessId: string, query: { employeeId?: string; page?: number; limit?: number }) {
    const { employeeId, page = 1, limit = 10 } = query;
    const qb = this.loanRepo.createQueryBuilder('l')
      .leftJoinAndSelect('l.employee', 'employee')
      .where('l.businessId = :businessId', { businessId });

    if (employeeId) qb.andWhere('l.employeeId = :employeeId', { employeeId });
    qb.orderBy('l.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }

  async updateLoan(businessId: string, id: string, dto: UpdateLoanDto) {
    const loan = await this.loanRepo.findOne({ where: { id, businessId } });
    if (!loan) throw new NotFoundException('Loan not found');
    Object.assign(loan, dto);
    return this.loanRepo.save(loan);
  }

  // ─── KPI ──────────────────────────────────────────────────────────────────

  async createKpi(businessId: string, userId: string, dto: CreateKpiDto) {
    await this.findEmployee(businessId, dto.employeeId);
    return this.kpiRepo.save(this.kpiRepo.create({ ...dto, businessId, evaluatedBy: userId }));
  }

  async findKpis(businessId: string, query: { employeeId?: string; year?: number; page?: number; limit?: number }) {
    const { employeeId, year, page = 1, limit = 10 } = query;
    const qb = this.kpiRepo.createQueryBuilder('k')
      .leftJoinAndSelect('k.employee', 'employee')
      .where('k.businessId = :businessId', { businessId });

    if (employeeId) qb.andWhere('k.employeeId = :employeeId', { employeeId });
    if (year) qb.andWhere('k.year = :year', { year });
    qb.orderBy('k.year', 'DESC').addOrderBy('k.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, totalItems] = await qb.getManyAndCount();
    return { data, meta: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) } };
  }
}
