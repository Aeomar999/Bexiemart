import { mockPrisma } from '../../prisma/prisma.mock';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new ServicesService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all services for a vendor', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.service.findMany.mockResolvedValue([]);
    const result = await service.findAll('user-1');
    expect(result).toEqual([]);
  });

  it('should find one service', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.service.findFirst.mockResolvedValue({ id: 'svc-1', vendorId: 'vp-1' } as any);
    const result = await service.findOne('user-1', 'svc-1');
    expect(result.id).toBe('svc-1');
  });

  it('should create a service', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.service.create.mockResolvedValue({ id: 'svc-1', name: 'Consulting' } as any);
    const result = await service.create('user-1', { name: 'Consulting', category: 'tech', price: 100 } as any);
    expect(result.id).toBe('svc-1');
  });

  it('should update a service', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.service.findFirst.mockResolvedValue({ id: 'svc-1', vendorId: 'vp-1' } as any);
    prisma.service.update.mockResolvedValue({ id: 'svc-1', name: 'Updated' } as any);
    const result = await service.update('user-1', 'svc-1', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('should delete a service', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.service.findFirst.mockResolvedValue({ id: 'svc-1', vendorId: 'vp-1' } as any);
    prisma.service.delete.mockResolvedValue({} as any);
    const result = await service.remove('user-1', 'svc-1');
    expect(result).toEqual({ success: true });
  });
});
