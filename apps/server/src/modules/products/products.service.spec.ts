import { mockPrisma } from '../../prisma/prisma.mock';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new ProductsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all products', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    prisma.product.count.mockResolvedValue(0);
    const result = await service.findAll({} as any);
    expect(result.data).toEqual([]);
  });

  it('should find a single product', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'p1',
      isActive: true,
      isDeleted: false,
      name: 'Test',
      slug: 'test',
      description: '',
      price: 50,
      stock: 10,
      deliveryOptions: null,
      images: [],
      category: { name: 'Cat' },
      vendor: { shopName: 'Shop', id: 'v1', logo: null, description: null },
      reviews: [],
      createdAt: new Date(),
    } as any);
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: 0 } as any);
    const result = await service.findOne('p1');
    expect(result.id).toBe('p1');
    expect(result.name).toBe('Test');
  });

  it('should throw when product not found', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.findOne('bad')).rejects.toThrow('Product not found');
  });

  it('should get categories', async () => {
    prisma.category.findMany.mockResolvedValue([]);
    const result = await service.getCategories();
    expect(result).toEqual([]);
  });

  it('should get store', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'v1', shopName: 'Shop', isActive: true, visits: 0 } as any);
    prisma.product.aggregate.mockResolvedValue({ _count: 5 } as any);
    const result = await service.getStore('v1');
    expect(result.name).toBe('Shop');
  });

  it('should get featured products', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    const result = await service.getFeatured();
    expect(result).toEqual([]);
  });

  it('should search products', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    const result = await service.searchProducts('test');
    expect(result).toEqual([]);
  });
});
