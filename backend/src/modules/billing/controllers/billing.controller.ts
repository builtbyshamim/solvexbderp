import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingService, PAYMENT_RECEIVE_NUMBER } from '../services/billing.service';
import { CreatePaymentRequestDto } from '../dto/billing.dto';
import { BusinessId } from 'src/common/decorators/business-id.decorator';

@ApiTags('Billing')
@Controller({ path: 'billing', version: '1' })
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('payment-info')
  @ApiOperation({ summary: 'Get payment receive number and supported methods' })
  getPaymentInfo() {
    return {
      receiveNumber: PAYMENT_RECEIVE_NUMBER,
      methods: ['bkash', 'rocket', 'nagad'],
      instructions: [
        `Send the plan amount to ${PAYMENT_RECEIVE_NUMBER} via bKash, Rocket, or Nagad`,
        'Note the Transaction ID from your mobile banking app',
        'Submit the Transaction ID and your sender mobile number below',
        'Admin will verify and activate your subscription within a few hours',
      ],
    };
  }

  @Post('payment-request')
  @ApiOperation({ summary: 'Submit a manual payment request (bKash / Rocket / Nagad)' })
  create(
    @BusinessId() businessId: string,
    @Body() dto: CreatePaymentRequestDto,
  ) {
    return this.billing.createPaymentRequest(businessId, dto);
  }

  @Get('payment-requests')
  @ApiOperation({ summary: 'My payment request history' })
  myHistory(@BusinessId() businessId: string) {
    return this.billing.getMyRequests(businessId);
  }

  @Get('payment-requests/pending')
  @ApiOperation({ summary: 'Check if I have an active pending request' })
  myPending(@BusinessId() businessId: string) {
    return this.billing.getMyPendingRequest(businessId);
  }
}
