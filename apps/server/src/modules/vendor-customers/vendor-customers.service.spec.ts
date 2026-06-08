import { mockPrisma } from '../../prisma/prisma.mock';
import { VendorCustomersService } from './vendor-customers.service';

describe('VendorCustomersService', () => {
  let service: VendorCustomersService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new VendorCustomersService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all customers', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.orderItem.findMany.mockResolvedValue([{ order: { userId: 'u1', total: 100, createdAt: new Date() } }] as any);
    prisma.user.findMany.mockResolvedValue([{ id: 'u1', name: 'Test', email: 't@t.com', image: null }] as any);
    const result = await service.findAll('user-1');
    expect(result).toHaveLength(1);
  });

  it('should find one customer', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Test', email: 'test@t.com', image: null } as any);
    prisma.order.findMany.mockResolvedValue([]);
    const result = await service.findOne('user-1', 'u1');
    expect(result.id).toBe('u1');
    expect(result.orders).toEqual([]);
  });
});
