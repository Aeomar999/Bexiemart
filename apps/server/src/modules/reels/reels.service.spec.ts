import { mockPrisma } from '../../prisma/prisma.mock';
import { ReelsService } from './reels.service';

describe('ReelsService', () => {
  let service: ReelsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new ReelsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all reels for a vendor', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1', userId: 'user-1' } as any);
    prisma.reel.findMany.mockResolvedValue([]);
    const result = await service.findAll('user-1');
    expect(result).toEqual([]);
  });

  it('should create a reel', async () => {
    prisma.reel.create.mockResolvedValue({ id: 'r1', videoUrl: 'vid.mp4' } as any);
    const result = await service.create('user-1', { videoUrl: 'vid.mp4', caption: 'Test' });
    expect(result.id).toBe('r1');
  });

  it('should find one reel', async () => {
    prisma.reel.findFirst.mockResolvedValue({ id: 'r1', userId: 'user-1' } as any);
    const result = await service.findOne('user-1', 'r1');
    expect(result.id).toBe('r1');
  });

  it('should update a reel', async () => {
    prisma.reel.findFirst.mockResolvedValue({ id: 'r1', userId: 'user-1' } as any);
    prisma.reel.update.mockResolvedValue({ id: 'r1', caption: 'Updated' } as any);
    const result = await service.update('user-1', 'r1', { caption: 'Updated' });
    expect(result.caption).toBe('Updated');
  });

  it('should soft-delete a reel', async () => {
    prisma.reel.findFirst.mockResolvedValue({ id: 'r1', userId: 'user-1' } as any);
    const result = await service.remove('user-1', 'r1');
    expect(result).toEqual({ success: true });
  });
});
