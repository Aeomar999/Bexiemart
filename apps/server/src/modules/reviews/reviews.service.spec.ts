import { mockPrisma } from '../../prisma/prisma.mock';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new ReviewsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create or upsert a review', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'p1', isActive: true, isDeleted: false } as any);
    prisma.review.upsert.mockResolvedValue({ id: 'r1', rating: 5, comment: 'Great!' } as any);
    const result = await service.create('user-1', { productId: 'p1', rating: 5, comment: 'Great!' });
    expect(result.id).toBe('r1');
  });

  it('should throw when product not found for review', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(service.create('user-1', { productId: 'bad', rating: 5 })).rejects.toThrow('Product not found');
  });

  it('should find reviews by product', async () => {
    prisma.review.findMany.mockResolvedValue([]);
    const result = await service.findByProduct('p1');
    expect(result).toEqual([]);
  });

  it('should get product stats', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1' } as any);
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { id: 10 } } as any);
    const result = await service.getProductStats('p1');
    expect(result._count.id).toBe(10);
  });

  it('should delete a review', async () => {
    prisma.review.findFirst.mockResolvedValue({ id: 'r1', userId: 'user-1' } as any);
    prisma.review.delete.mockResolvedValue({} as any);
    const result = await service.remove('user-1', 'r1');
    expect(result).toEqual({ success: true });
  });
});
