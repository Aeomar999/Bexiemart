import { mockPrisma } from '../../prisma/prisma.mock';
import { AddressesService } from './addresses.service';

describe('AddressesService', () => {
  let service: AddressesService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new AddressesService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all addresses for a user', async () => {
    prisma.userAddress.findMany.mockResolvedValue([]);
    const result = await service.findAll('user-1');
    expect(prisma.userAddress.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    expect(result).toEqual([]);
  });

  it('should create an address', async () => {
    prisma.userAddress.count.mockResolvedValue(0);
    prisma.userAddress.create.mockResolvedValue({
      id: 'addr-1',
      userId: 'user-1',
      type: 'home',
      name: 'Home',
      address: '123 Street',
      city: 'Accra',
      phone: '123456789',
      isDefault: true,
    } as any);
    const result = await service.create('user-1', {
      type: 'home',
      name: 'Home',
      address: '123 Street',
      city: 'Accra',
      phone: '123456789',
    });
    expect(result.isDefault).toBe(true);
  });

  it('should throw on update when address is not found', async () => {
    prisma.userAddress.findFirst.mockResolvedValue(null);
    await expect(service.update('user-1', 'bad-id', {})).rejects.toThrow('Address not found');
  });

  it('should remove an address', async () => {
    prisma.userAddress.findFirst.mockResolvedValue({ id: 'a1', isDefault: false } as any);
    prisma.userAddress.delete.mockResolvedValue({} as any);
    const result = await service.remove('user-1', 'a1');
    expect(result).toEqual({ success: true });
  });

  it('should set default address', async () => {
    prisma.userAddress.findFirst.mockResolvedValue({ id: 'a1' } as any);
    prisma.userAddress.update.mockResolvedValue({ id: 'a1', isDefault: true } as any);
    const result = await service.setDefault('user-1', 'a1');
    expect(result.isDefault).toBe(true);
  });
});
