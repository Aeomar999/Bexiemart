import { mockPrisma } from '../../prisma/prisma.mock';
import { VendorStaffService } from './vendor-staff.service';

describe('VendorStaffService', () => {
  let service: VendorStaffService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new VendorStaffService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all staff', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.vendorStaff.findMany.mockResolvedValue([]);
    const result = await service.findAll('user-1');
    expect(result).toEqual([]);
  });

  it('should create a staff member', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.vendorStaff.findUnique.mockResolvedValue(null);
    prisma.vendorStaff.create.mockResolvedValue({ id: 's-1', name: 'Staff 1' } as any);
    const result = await service.create('user-1', { name: 'Staff 1', email: 's@t.com', role: 'STAFF' });
    expect(result.id).toBe('s-1');
  });

  it('should update staff', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.vendorStaff.findFirst.mockResolvedValue({ id: 's-1', vendorId: 'vp-1' } as any);
    prisma.vendorStaff.update.mockResolvedValue({ id: 's-1', role: 'MANAGER' } as any);
    const result = await service.update('user-1', 's-1', { role: 'MANAGER' });
    expect(result.role).toBe('MANAGER');
  });

  it('should delete a staff member', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.vendorStaff.findFirst.mockResolvedValue({ id: 's-1', vendorId: 'vp-1' } as any);
    prisma.vendorStaff.delete.mockResolvedValue({} as any);
    const result = await service.remove('user-1', 's-1');
    expect(result).toEqual({ success: true });
  });

  it('should toggle staff active status', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.vendorStaff.findFirst.mockResolvedValue({ id: 's-1', vendorId: 'vp-1', isActive: false } as any);
    prisma.vendorStaff.update.mockResolvedValue({ isActive: true } as any);
    const result = await service.toggle('user-1', 's-1');
    expect(result.isActive).toBe(true);
  });
});
