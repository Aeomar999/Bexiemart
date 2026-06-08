import { mockPrisma } from '../../prisma/prisma.mock';
import { VendorPaymentMethodsService } from './vendor-payment-methods.service';

describe('VendorPaymentMethodsService', () => {
  let service: VendorPaymentMethodsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new VendorPaymentMethodsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all payment methods', async () => {
    prisma.wallet.findUnique.mockResolvedValue({ id: 'w-1' } as any);
    prisma.bankAccount.findMany.mockResolvedValue([]);
    prisma.momoAccount.findMany.mockResolvedValue([]);
    const result = await service.findAll('user-1');
    expect(result.bankAccounts).toEqual([]);
    expect(result.momoAccounts).toEqual([]);
  });

  it('should add a bank account', async () => {
    prisma.wallet.findUnique.mockResolvedValue(null);
    prisma.wallet.create.mockResolvedValue({ id: 'w-1' } as any);
    prisma.bankAccount.count.mockResolvedValue(0);
    prisma.bankAccount.create.mockResolvedValue({ id: 'b-1', bankName: 'GTBank' } as any);
    const result = await service.addBank('user-1', { bankName: 'GTBank', bankCode: '123', accountNumber: '0000000000', accountName: 'Test' });
    expect(result.bankName).toBe('GTBank');
  });

  it('should add a momo account', async () => {
    prisma.wallet.findUnique.mockResolvedValue(null);
    prisma.wallet.create.mockResolvedValue({ id: 'w-1' } as any);
    prisma.momoAccount.findUnique.mockResolvedValue(null);
    prisma.momoAccount.count.mockResolvedValue(0);
    prisma.momoAccount.create.mockResolvedValue({ id: 'm-1', provider: 'MTN' } as any);
    const result = await service.addMomo('user-1', { provider: 'MTN', phoneNumber: '0240000000', accountName: 'Test' });
    expect(result.provider).toBe('MTN');
  });

  it('should remove a payment method', async () => {
    prisma.wallet.findUnique.mockResolvedValue({ id: 'w-1' } as any);
    prisma.bankAccount.findFirst.mockResolvedValue({ id: 'b-1', walletId: 'w-1' } as any);
    prisma.bankAccount.delete.mockResolvedValue({} as any);
    const result = await service.remove('user-1', 'bank', 'b-1');
    expect(result).toEqual({ success: true });
  });

  it('should set default method', async () => {
    prisma.wallet.findUnique.mockResolvedValue({ id: 'w-1' } as any);
    prisma.bankAccount.updateMany.mockResolvedValue({} as any);
    prisma.bankAccount.update.mockResolvedValue({ id: 'b-1', isDefault: true } as any);
    const result = await service.setDefault('user-1', 'bank', 'b-1');
    expect(result.isDefault).toBe(true);
  });
});
