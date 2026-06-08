import { mockPrisma } from '../../prisma/prisma.mock';
import { CollectionsService } from './collections.service';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new CollectionsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get user collections', async () => {
    prisma.collection.findMany.mockResolvedValue([]);
    const result = await service.getUserCollections('user-1');
    expect(result).toEqual({ data: [] });
  });

  it('should get a single collection', async () => {
    prisma.collection.findUnique.mockResolvedValue({ id: 'c1', userId: 'user-1' } as any);
    const result = await service.getCollection('user-1', 'c1');
    expect(result.data.id).toBe('c1');
  });

  it('should throw when collection not found', async () => {
    prisma.collection.findUnique.mockResolvedValue(null);
    await expect(service.getCollection('user-1', 'bad')).rejects.toThrow('Collection not found');
  });

  it('should create a collection', async () => {
    const mock = { id: 'c1', userId: 'user-1', name: 'Faves', description: null };
    prisma.collection.create.mockResolvedValue(mock as any);
    const result = await service.createCollection('user-1', 'Faves');
    expect(result.data.name).toBe('Faves');
  });

  it('should delete a collection', async () => {
    prisma.collection.findUnique.mockResolvedValue({ id: 'c1', userId: 'user-1' } as any);
    prisma.collection.delete.mockResolvedValue({} as any);
    const result = await service.deleteCollection('user-1', 'c1');
    expect(result.message).toBe('Collection deleted');
  });

  it('should add item to collection', async () => {
    prisma.collection.findUnique.mockResolvedValue({ id: 'c1', userId: 'user-1' } as any);
    prisma.product.findUnique.mockResolvedValue({ id: 'p1' } as any);
    prisma.collectionItem.create.mockResolvedValue({} as any);
    const result = await service.addItemToCollection('user-1', 'c1', 'p1');
    expect(result.message).toBe('Item added to collection');
  });
});
