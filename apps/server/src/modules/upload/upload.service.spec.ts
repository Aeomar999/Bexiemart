import { ConfigService } from '@nestjs/config';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    utils: { api_sign_request: jest.fn().mockReturnValue('signed') },
    uploader: { upload_stream: jest.fn() },
  },
}));

import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let config: { get: jest.Mock };

  beforeEach(() => {
    config = { get: jest.fn().mockReturnValue('test_value') };
    service = new UploadService(config as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return signature', () => {
    const result = service.getSignature('folder-1');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('signature');
    expect(result).toHaveProperty('api_key');
    expect(result.folder).toBe('folder-1');
  });

  it('should upload a file', async () => {
    const { v2: cloudinary } = require('cloudinary');
    const mockStream = { end: jest.fn() };
    cloudinary.uploader.upload_stream.mockImplementation((_opts: any, cb: any) => {
      cb(null, { secure_url: 'https://cdn.example.com/img.jpg', public_id: 'img.jpg' });
      return mockStream;
    });
    const result = await service.uploadFile({ buffer: Buffer.from('test') } as any, 'folder-1');
    expect(result.url).toBe('https://cdn.example.com/img.jpg');
    expect(result.public_id).toBe('img.jpg');
  });

  it('should reject when no file provided', async () => {
    await expect(service.uploadFile(null as any)).rejects.toThrow('No file provided');
  });
});
