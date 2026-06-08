import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return system metrics with expected shape', () => {
    const result = service.getMetrics();
    expect(result).toHaveProperty('uptime');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('memory');
    expect(result).toHaveProperty('cpu');
    expect(result).toHaveProperty('platform');
    expect(result).toHaveProperty('release');
    expect(result).toHaveProperty('arch');
    expect(typeof result.uptime).toBe('number');
    expect(typeof result.timestamp).toBe('number');
  });
});
