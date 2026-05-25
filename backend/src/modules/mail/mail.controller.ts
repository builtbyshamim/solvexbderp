import { Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { PublicRoute } from 'src/common/decorators/public.decorator';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @PublicRoute()
  @Post('test-mail')
  sendTestMail() {
    return this.mailService.sendMail({
      to: 'shamimhossain01617@gmail.com',
      subject: 'Test Email',
      text: 'Mail system working fine 🚀',
    });
  }
}
