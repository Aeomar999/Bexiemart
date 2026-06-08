import { mockPrisma } from '../../prisma/prisma.mock';
import { VendorDocumentsService } from './vendor-documents.service';

describe('VendorDocumentsService', () => {
  let service: VendorDocumentsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new VendorDocumentsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all documents', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.vendorDocument.findMany.mockResolvedValue([]);
    const result = await service.findAll('user-1');
    expect(result).toEqual([]);
  });

  it('should create a document', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.vendorDocument.create.mockResolvedValue({ id: 'd1', name: 'License' } as any);
    const result = await service.create('user-1', { name: 'License', url: 'https://...', type: 'pdf' });
    expect(result.id).toBe('d1');
  });

  it('should delete a document', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp-1' } as any);
    prisma.vendorDocument.findFirst.mockResolvedValue({ id: 'd1', vendorId: 'vp-1' } as any);
    prisma.vendorDocument.delete.mockResolvedValue({} as any);
    const result = await service.remove('user-1', 'd1');
    expect(result).toEqual({ success: true });
  });
});
