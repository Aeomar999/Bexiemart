import { mockPrisma } from '../../prisma/prisma.mock';
import { DispatcherService } from './dispatcher.service';

describe('DispatcherService', () => {
  let service: DispatcherService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new DispatcherService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get profile', async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: 'dp-1', userId: 'user-1' } as any);
    const result = await service.getProfile('user-1');
    expect(result.id).toBe('dp-1');
  });

  it('should throw when profile not found', async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue(null);
    await expect(service.getProfile('bad')).rejects.toThrow('Dispatcher profile not found');
  });

  it('should create profile', async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER' } as any);
    prisma.user.update.mockResolvedValue({} as any);
    prisma.dispatcherProfile.create.mockResolvedValue({ id: 'dp-1', vehicleType: 'bike' } as any);
    const result = await service.createProfile('user-1', { vehicleType: 'bike' });
    expect(result.vehicleType).toBe('bike');
  });

  it('should update status', async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: 'dp-1' } as any);
    prisma.dispatcherProfile.update.mockResolvedValue({ status: 'ONLINE' } as any);
    const result = await service.updateStatus('user-1', 'ONLINE');
    expect(result.status).toBe('ONLINE');
  });

  it('should update location', async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: 'dp-1' } as any);
    prisma.dispatcherProfile.update.mockResolvedValue({ lastLatitude: 5.6, lastLongitude: -0.2 } as any);
    const result = await service.updateLocation('user-1', 5.6, -0.2);
    expect(result.lastLatitude).toBe(5.6);
  });

  it('should accept a ride task', async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: 'dp-1', status: 'ONLINE' } as any);
    prisma.rideRequest.findUnique.mockResolvedValue({ id: 'ride-1', status: 'PENDING' } as any);
    prisma.rideRequest.update.mockResolvedValue({ status: 'ACCEPTED' } as any);
    const result = await service.acceptTask('user-1', 'ride-1', 'ride');
    expect(result.status).toBe('ACCEPTED');
  });

  it('should get earnings', async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: 'dp-1', pendingPayout: 0 } as any);
    prisma.wallet.findUnique.mockResolvedValue(null);
    const result = await service.getEarnings('user-1');
    expect(result.availableBalance).toBe(0);
  });

  it('should withdraw earnings', async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: 'dp-1', pendingPayout: 500 } as any);
    prisma.wallet.findUnique.mockResolvedValue({ id: 'w-1', currency: 'GHS' } as any);
    prisma.$transaction.mockImplementation(async (args: any) => args);
    const result = await service.withdrawEarnings('user-1', 100, 'bank');
    expect(result.success).toBe(true);
  });
});
