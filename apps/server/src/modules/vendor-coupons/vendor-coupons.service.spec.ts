import { mockPrisma } from '../../prisma/prisma.mock';
import { VendorCouponsService } from './vendor-coupons.service';

describe('VendorCouponsService', () => {
  let service: VendorCouponsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new VendorCouponsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all coupons for a vendor', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.coupon.findMany.mockResolvedValue([]);
    const result = await service.findAll('user-1');
    expect(result).toEqual([]);
  });

  it('should create a coupon', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.coupon.findUnique.mockResolvedValue(null);
    prisma.coupon.create.mockResolvedValue({ id: 'c1', code: 'SAVE10' } as any);
    const result = await service.create('user-1', { code: 'save10', discountPercent: 10, expiresAt: '2026-12-31' } as any);
    expect(result.code).toBe('SAVE10');
  });

  it('should update a coupon', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.coupon.findFirst.mockResolvedValue({ id: 'c1', vendorId: 'vp-1' } as any);
    prisma.coupon.update.mockResolvedValue({ id: 'c1', discountPercent: 15 } as any);
    const result = await service.update('user-1', 'c1', { discountPercent: 15 });
    expect(result.discountPercent).toBe(15);
  });

  it('should delete a coupon', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.coupon.findFirst.mockResolvedValue({ id: 'c1', vendorId: 'vp-1' } as any);
    prisma.coupon.delete.mockResolvedValue({} as any);
    const result = await service.remove('user-1', 'c1');
    expect(result).toEqual({ success: true });
  });

  it('should toggle coupon active status', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.coupon.findFirst.mockResolvedValue({ id: 'c1', vendorId: 'vp-1', isActive: false } as any);
    prisma.coupon.update.mockResolvedValue({ isActive: true } as any);
    const result = await service.toggle('user-1', 'c1');
    expect(result.isActive).toBe(true);
  });
});
