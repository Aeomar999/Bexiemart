import { mockPrisma } from '../../prisma/prisma.mock';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new NotificationsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all notifications with pagination', async () => {
    prisma.notification.findMany.mockResolvedValue([]);
    prisma.notification.count.mockResolvedValue(0);
    const result = await service.findAll('user-1');
    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('should get unread count', async () => {
    prisma.notification.count.mockResolvedValue(3);
    const result = await service.getUnreadCount('user-1');
    expect(result).toBe(3);
  });

  it('should mark as read', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 1 } as any);
    const result = await service.markAsRead('user-1', 'n1');
    expect(result).toEqual({ success: true });
  });

  it('should mark all as read', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 5 } as any);
    const result = await service.markAllAsRead('user-1');
    expect(result).toEqual({ success: true });
  });
});
