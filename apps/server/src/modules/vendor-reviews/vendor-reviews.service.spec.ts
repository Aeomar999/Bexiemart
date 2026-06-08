import { mockPrisma } from '../../prisma/prisma.mock';
import { VendorReviewsService } from './vendor-reviews.service';

describe('VendorReviewsService', () => {
  let service: VendorReviewsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new VendorReviewsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all reviews for vendor products', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.review.findMany.mockResolvedValue([]);
    const result = await service.findAll('user-1');
    expect(result).toEqual([]);
  });

  it('should reply to a review', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.review.findFirst.mockResolvedValue({ id: 'r1', product: { vendorId: 'vp-1' } } as any);
    prisma.review.update.mockResolvedValue({ id: 'r1', reply: 'Thanks!', replyAt: new Date() } as any);
    const result = await service.reply('user-1', 'r1', 'Thanks!');
    expect(result.reply).toBe('Thanks!');
  });
});
