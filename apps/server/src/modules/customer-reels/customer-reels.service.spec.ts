import { mockPrisma } from '../../prisma/prisma.mock';
import { CustomerReelsService } from './customer-reels.service';

describe('CustomerReelsService', () => {
  let service: CustomerReelsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new CustomerReelsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all active reels', async () => {
    prisma.reel.findMany.mockResolvedValue([]);
    const result = await service.findAll('user-1');
    expect(result).toEqual([]);
  });

  it('should toggle like on a reel (add)', async () => {
    prisma.reel.findUnique.mockResolvedValue({ id: 'r1' } as any);
    prisma.reelLike.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (args: any) => args);
    prisma.reelLike.create.mockResolvedValue({} as any);
    prisma.reel.update.mockResolvedValue({} as any);
    const result = await service.toggleLike('user-1', 'r1');
    expect(result.liked).toBe(true);
  });

  it('should toggle like on a reel (remove)', async () => {
    prisma.reel.findUnique.mockResolvedValue({ id: 'r1' } as any);
    prisma.reelLike.findUnique.mockResolvedValue({ id: 'like-1' } as any);
    prisma.$transaction.mockImplementation(async (args: any) => args);
    const result = await service.toggleLike('user-1', 'r1');
    expect(result.liked).toBe(false);
  });

  it('should increment view count', async () => {
    prisma.reel.update.mockResolvedValue({ viewsCount: 10 } as any);
    const result = await service.incrementView('r1');
    expect(result.viewsCount).toBe(10);
  });

  it('should find following reels', async () => {
    prisma.vendorFollow.findMany.mockResolvedValue([{ vendorId: 'v1' }] as any);
    prisma.reel.findMany.mockResolvedValue([{ id: 'r1', likes: [] }] as any);
    const result = await service.findFollowing('user-1');
    expect(result).toHaveLength(1);
  });
});
