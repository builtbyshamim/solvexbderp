import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { CustomerEntity } from '../entities/customer.entity';

const EXPORT_COLUMNS = ['name', 'phone', 'email', 'address', 'customerType', 'openingBalance', 'closingBalance'];
const IMPORT_COLUMNS = ['name', 'phone', 'email', 'address', 'openingBalance'];

@Injectable()
export class CustomerImportExportService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
  ) {}

  getTemplate(): Buffer {
    const sample = [
      {
        name: 'John Doe',
        phone: '01712345678',
        email: 'john@example.com',
        address: 'Dhaka, Bangladesh',
        openingBalance: 0,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample, { header: IMPORT_COLUMNS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async exportCustomers(businessId: string): Promise<Buffer> {
    const customers = await this.customerRepo.find({
      where: { businessId },
      relations: ['customerType'],
      order: { name: 'ASC' },
    });

    const rows = customers.map((c) => ({
      name: c.name,
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      customerType: (c as any).customerType?.name ?? '',
      openingBalance: Number(c.openingBalance),
      closingBalance: Number(c.currentBalance),
    }));

    const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_COLUMNS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async importCustomers(
    businessId: string,
    file: Express.Multer.File,
  ): Promise<{ success: number; failed: number; errors: { row: number; message: string }[] }> {
    if (!file?.buffer) throw new BadRequestException('File is required');

    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rows.length) throw new BadRequestException('The file contains no data rows');

    const results = { success: 0, failed: 0, errors: [] as { row: number; message: string }[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const name = String(row.name ?? '').trim();
        if (!name) throw new Error('Customer name is required');

        const phone = row.phone !== '' ? String(row.phone).trim() : undefined;
        if (!phone) throw new Error('Mobile number is required');

        const openingBalance = row.openingBalance !== '' ? Number(row.openingBalance) : 0;
        if (isNaN(openingBalance) || openingBalance < 0) {
          throw new Error('openingBalance must be a valid non-negative number');
        }

        const nameExists = await this.customerRepo.findOne({ where: { businessId, name: ILike(name) } });
        if (nameExists) throw new Error(`Customer "${name}" already exists`);

        const phoneExists = await this.customerRepo.findOne({ where: { businessId, phone } });
        if (phoneExists) throw new Error(`Mobile number ${phone} is already registered`);

        const customer = this.customerRepo.create({
          businessId,
          name,
          phone,
          email: row.email !== '' ? String(row.email).trim() : undefined,
          address: row.address !== '' ? String(row.address).trim() : undefined,
          openingBalance,
          currentBalance: openingBalance,
        });

        await this.customerRepo.save(customer);
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: rowNum, message: err.message ?? 'Unknown error' });
      }
    }

    return results;
  }
}
