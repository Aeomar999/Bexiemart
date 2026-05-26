export const mockPrisma = (): any => ({
  $queryRaw: jest.fn(),
  $transaction: jest.fn((cb: any) => cb(mockPrisma())),
  wallet: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  transaction: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  cart: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  cartItem: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  orderItem: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  shippingAddress: {
    create: jest.fn(),
  },
  escrow: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  vendorProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  referral: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  referredUser: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  conversation: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  conversationParticipant: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  platformConfig: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
});
