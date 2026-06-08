import { mockPrisma } from '../../prisma/prisma.mock';
import { CouponsService } from './coupons.service';

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new CouponsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate a valid coupon', async () => {
    const future = new Date(Date.now() + 86_400_000);
    prisma.coupon.findUnique.mockResolvedValue({
      code: 'SAVE10',
      isActive: true,
      expiresAt: future,
      currentUses: 0,
      maxUses: 100,
      minOrderAmount: 50,
      discountPercent: 10,
    } as any);
    const result = await service.validate('SAVE10', 100);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(10);
  });

  it('should reject an expired coupon', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      code: 'EXPIRED',
      isActive: true,
      expiresAt: new Date(0),
      currentUses: 0,
      maxUses: 100,
      minOrderAmount: 0,
      discountPercent: 10,
    } as any);
    await expect(service.validate('EXPIRED', 100)).rejects.toThrow('Coupon has expired');
  });

  it('should reject an inactive coupon', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      code: 'OFF',
      isActive: false,
      expiresAt: new Date(Date.now() + 86_400_000),
      currentUses: 0,
      maxUses: 100,
      minOrderAmount: 0,
      discountPercent: 10,
    } as any);
    await expect(service.validate('OFF', 100)).rejects.toThrow('Coupon is no longer active');
  });
});
