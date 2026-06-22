import {
  BadRequestException, ConflictException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentRequestEntity, PaymentRequestStatus,
} from '../entities/payment-request.entity';
import {
  CreatePaymentRequestDto, GetPaymentRequestsDto, ReviewPaymentRequestDto,
} from '../dto/billing.dto';
import { BusinessEntity } from 'src/modules/business/entities/business.entity';
import { PackageEntity } from 'src/modules/packages/entities/package.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

// The mobile banking number that all customers send money to
export const PAYMENT_RECEIVE_NUMBER = '01617650797';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(PaymentRequestEntity)
    private readonly paymentRepo: Repository<PaymentRequestEntity>,
    @InjectRepository(BusinessEntity)
    private readonly businessRepo: Repository<BusinessEntity>,
    @InjectRepository(PackageEntity)
    private readonly packageRepo: Repository<PackageEntity>,
  ) {}

  // ── Tenant: submit a payment request ──────────────────────────────────────

  async createPaymentRequest(businessId: string, dto: CreatePaymentRequestDto) {
    const pending = await this.paymentRepo.findOne({
      where: { businessId, status: PaymentRequestStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException(
        'আপনার একটি পেমেন্ট রিকোয়েস্ট ইতিমধ্যে রিভিউতে আছে। অনুগ্রহ করে অ্যাডমিনের কনফার্মেশনের জন্য অপেক্ষা করুন।',
      );
    }

    const pkg = await this.packageRepo.findOne({
      where: { id: dto.packageId, isActive: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    // Validate amount matches plan price (within ±1 taka tolerance)
    const expectedAmount = dto.billingCycle === 'yearly'
      ? Number(pkg.yearlyPrice)
      : Number(pkg.monthlyPrice);

    if (Math.abs(Number(dto.amount) - expectedAmount) > 1) {
      throw new BadRequestException(
        `Amount mismatch. Expected ৳${expectedAmount} for ${pkg.name} (${dto.billingCycle}).`,
      );
    }

    const req = this.paymentRepo.create({
      businessId,
      packageId: dto.packageId,
      billingCycle: dto.billingCycle,
      paymentMethod: dto.paymentMethod,
      senderMobile: dto.senderMobile,
      transactionId: dto.transactionId,
      amount: dto.amount,
    });

    const saved = await this.paymentRepo.save(req);
    return {
      message: 'Payment request submitted. Admin will verify and activate your subscription.',
      request: this.formatRequest(saved),
    };
  }

  async getMyRequests(businessId: string) {
    const rows = await this.paymentRepo.find({
      where: { businessId },
      relations: ['package'],
      order: { createdAt: 'DESC' },
      take: 10,
    });
    return rows.map(this.formatRequest.bind(this));
  }

  async getMyPendingRequest(businessId: string) {
    const row = await this.paymentRepo.findOne({
      where: { businessId, status: PaymentRequestStatus.PENDING },
      relations: ['package'],
    });
    return row ? this.formatRequest(row) : null;
  }

  // ── Super Admin ────────────────────────────────────────────────────────────

  async getAllRequests(dto: GetPaymentRequestsDto) {
    const page  = Number(dto.page)  || 1;
    const limit = Number(dto.limit) || 20;
    const skip  = (page - 1) * limit;

    const where: any = {};
    if (dto.status && dto.status !== 'all') where.status = dto.status;

    const [items, total] = await this.paymentRepo.findAndCount({
      where,
      relations: ['business', 'package'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items: items.map(this.formatRequest.bind(this)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPendingCount(): Promise<number> {
    return this.paymentRepo.count({ where: { status: PaymentRequestStatus.PENDING } });
  }

  async reviewRequest(id: string, dto: ReviewPaymentRequestDto, admin: UserEntity) {
    const req = await this.paymentRepo.findOne({
      where: { id },
      relations: ['package', 'business'],
    });
    if (!req) throw new NotFoundException('Payment request not found');

    if (req.status !== PaymentRequestStatus.PENDING) {
      throw new BadRequestException(`Request is already ${req.status}`);
    }

    req.status = dto.action === 'approved'
      ? PaymentRequestStatus.APPROVED
      : PaymentRequestStatus.REJECTED;
    req.adminNote  = dto.adminNote ?? null;
    req.reviewedBy = admin.id;
    req.reviewedAt = new Date();

    await this.paymentRepo.save(req);

    if (dto.action === 'approved') {
      await this.activateSubscription(req);
    }

    return {
      message: `Payment request ${req.status}`,
      request: this.formatRequest(req),
    };
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private async activateSubscription(req: PaymentRequestEntity) {
    const business = await this.businessRepo.findOne({ where: { id: req.businessId } });
    if (!business) return;

    const days = req.billingCycle === 'yearly' ? 365 : 30;

    // Extend from current expiry if still active, otherwise from now
    const base =
      business.subscriptionExpiresAt && business.subscriptionExpiresAt > new Date()
        ? business.subscriptionExpiresAt
        : new Date();

    const newExpiry = new Date(base);
    newExpiry.setDate(newExpiry.getDate() + days);

    business.subscriptionExpiresAt = newExpiry;
    business.subscriptionStatus    = 'active';
    business.packageId             = req.package.id;
    business.subscriptionPlan      = req.package.name;
    business.billingCycle          = req.billingCycle;

    await this.businessRepo.save(business);
  }

  private formatRequest(req: PaymentRequestEntity) {
    return {
      id:            req.id,
      packageId:     req.packageId,
      billingCycle:  req.billingCycle,
      paymentMethod: req.paymentMethod,
      senderMobile:  req.senderMobile,
      transactionId: req.transactionId,
      amount:        Number(req.amount),
      status:        req.status,
      adminNote:     req.adminNote,
      reviewedBy:    req.reviewedBy,
      reviewedAt:    req.reviewedAt?.toISOString() ?? null,
      createdAt:     req.createdAt?.toISOString() ?? null,
      package:       req.package
        ? {
            id:    req.package.id,
            name:  req.package.name,
            badge: req.package.badge,
          }
        : null,
      business: req.business
        ? {
            id:   req.business.id,
            name: req.business.name,
          }
        : null,
    };
  }
}
