import { mockPrisma } from '../../prisma/prisma.mock';
import { VendorHoursService } from './vendor-hours.service';

describe('VendorHoursService', () => {
  let service: VendorHoursService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new VendorHoursService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all hours with defaults when empty', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.vendorHours.findMany.mockResolvedValueOnce([]);
    prisma.vendorHours.createMany.mockResolvedValue({} as any);
    prisma.vendorHours.findMany.mockResolvedValueOnce(
      Array.from({ length: 7 }, (_, i) => ({ day: i, isOpen: i !== 0 } as any))
    );
    const result = await service.findAll('user-1');
    expect(result.length).toBe(7);
  });

  it('should update hours', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.vendorHours.upsert.mockResolvedValue({} as any);
    prisma.vendorHours.findMany.mockResolvedValue([]);
    const result = await service.update('user-1', [{ day: 1, isOpen: true, openTime: '09:00', closeTime: '17:00' }]);
    expect(result).toEqual([]);
  });
});
