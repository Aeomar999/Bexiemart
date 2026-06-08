import { mockPrisma } from '../../prisma/prisma.mock';
import { WishlistService } from './wishlist.service';

describe('WishlistService', () => {
  let service: WishlistService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new WishlistService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get wishlist', async () => {
    prisma.wishlist.findMany.mockResolvedValue([]);
    const result = await service.getWishlist('user-1');
    expect(result).toEqual({ data: [] });
  });

  it('should toggle wishlist add', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1' } as any);
    prisma.wishlist.findUnique.mockResolvedValue(null);
    prisma.wishlist.create.mockResolvedValue({} as any);
    const result = await service.toggleWishlist('user-1', 'p1');
    expect(result.isFavorited).toBe(true);
    expect(result.message).toBe('Added to wishlist');
  });

  it('should toggle wishlist remove', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1' } as any);
    prisma.wishlist.findUnique.mockResolvedValue({ id: 'w1' } as any);
    prisma.wishlist.delete.mockResolvedValue({} as any);
    const result = await service.toggleWishlist('user-1', 'p1');
    expect(result.isFavorited).toBe(false);
    expect(result.message).toBe('Removed from wishlist');
  });
});
