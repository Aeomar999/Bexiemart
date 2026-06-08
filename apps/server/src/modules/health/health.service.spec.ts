import { mockPrisma } from '../../prisma/prisma.mock';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new HealthService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return healthy when query succeeds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    const result = await service.checkDatabase();
    expect(result.status).toBe('healthy');
    expect(typeof result.latencyMs).toBe('number');
  });

  it('should return unhealthy when query fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('DB down'));
    const result = await service.checkDatabase();
    expect(result.status).toBe('unhealthy');
    expect(result.latencyMs).toBeNull();
  });
});
