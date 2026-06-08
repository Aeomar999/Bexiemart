import { mockPrisma } from '../../prisma/prisma.mock';
import { CustomerServicesService } from './customer-services.service';

describe('CustomerServicesService', () => {
  let service: CustomerServicesService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new CustomerServicesService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all services with pagination', async () => {
    prisma.service.findMany.mockResolvedValue([]);
    prisma.service.count.mockResolvedValue(0);
    const result = await service.findAll();
    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('should find a single service', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 'svc-1', isActive: true } as any);
    const result = await service.findOne('svc-1');
    expect(result.id).toBe('svc-1');
  });

  it('should throw when service not found', async () => {
    prisma.service.findFirst.mockResolvedValue(null);
    await expect(service.findOne('bad')).rejects.toThrow('Service not found');
  });

  it('should book a service', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 'svc-1', isActive: true } as any);
    prisma.serviceBooking.create.mockResolvedValue({ id: 'bk-1' } as any);
    const result = await service.book('user-1', 'svc-1', {});
    expect(result.id).toBe('bk-1');
  });

  it('should cancel a booking', async () => {
    prisma.serviceBooking.findUnique.mockResolvedValue({ id: 'bk-1', userId: 'user-1' } as any);
    prisma.serviceBooking.update.mockResolvedValue({ status: 'CANCELLED' } as any);
    const result = await service.cancel('user-1', 'bk-1');
    expect(result.status).toBe('CANCELLED');
  });
});
