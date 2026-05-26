
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  emailVerified: 'emailVerified',
  image: 'image',
  role: 'role',
  onboardingCompleted: 'onboardingCompleted',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  expiresAt: 'expiresAt',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  accountId: 'accountId',
  providerId: 'providerId',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  idToken: 'idToken',
  accessTokenExpiresAt: 'accessTokenExpiresAt',
  refreshTokenExpiresAt: 'refreshTokenExpiresAt',
  scope: 'scope',
  tokenType: 'tokenType',
  password: 'password',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VerificationScalarFieldEnum = {
  id: 'id',
  identifier: 'identifier',
  value: 'value',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VendorProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  shopName: 'shopName',
  slug: 'slug',
  description: 'description',
  logo: 'logo',
  banner: 'banner',
  address: 'address',
  city: 'city',
  state: 'state',
  phone: 'phone',
  isActive: 'isActive',
  totalEarnings: 'totalEarnings',
  pendingPayout: 'pendingPayout',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  icon: 'icon',
  description: 'description',
  isActive: 'isActive'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  price: 'price',
  stock: 'stock',
  categoryId: 'categoryId',
  vendorId: 'vendorId',
  isActive: 'isActive',
  isFeatured: 'isFeatured',
  isDeleted: 'isDeleted',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deliveryOptions: 'deliveryOptions'
};

exports.Prisma.ProductImageScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  url: 'url',
  isPrimary: 'isPrimary',
  order: 'order'
};

exports.Prisma.WishlistScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  productId: 'productId',
  createdAt: 'createdAt'
};

exports.Prisma.CartScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  cartId: 'cartId',
  productId: 'productId',
  productName: 'productName',
  price: 'price',
  quantity: 'quantity',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  userId: 'userId',
  status: 'status',
  subtotal: 'subtotal',
  shippingFee: 'shippingFee',
  tax: 'tax',
  total: 'total',
  paymentStatus: 'paymentStatus',
  paymentMethod: 'paymentMethod',
  paystackRef: 'paystackRef',
  shippingAddressId: 'shippingAddressId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  productId: 'productId',
  productName: 'productName',
  productSlug: 'productSlug',
  price: 'price',
  quantity: 'quantity',
  total: 'total',
  imageUrl: 'imageUrl'
};

exports.Prisma.ShippingAddressScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  firstName: 'firstName',
  lastName: 'lastName',
  phone: 'phone',
  email: 'email',
  address: 'address',
  city: 'city',
  state: 'state',
  zipCode: 'zipCode',
  country: 'country',
  instructions: 'instructions'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  userId: 'userId',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  paystackRef: 'paystackRef',
  paystackTxRef: 'paystackTxRef',
  paymentMethod: 'paymentMethod',
  channel: 'channel',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CouponScalarFieldEnum = {
  id: 'id',
  code: 'code',
  vendorId: 'vendorId',
  discountPercent: 'discountPercent',
  minOrderAmount: 'minOrderAmount',
  maxUses: 'maxUses',
  currentUses: 'currentUses',
  isActive: 'isActive',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  type: 'type',
  isRead: 'isRead',
  data: 'data',
  createdAt: 'createdAt'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  productId: 'productId',
  rating: 'rating',
  comment: 'comment',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConversationScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConversationParticipantScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  userId: 'userId',
  lastReadAt: 'lastReadAt',
  joinedAt: 'joinedAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  senderId: 'senderId',
  content: 'content',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.StoryScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  mediaUrl: 'mediaUrl',
  caption: 'caption',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.StoryViewScalarFieldEnum = {
  id: 'id',
  storyId: 'storyId',
  viewerId: 'viewerId',
  viewedAt: 'viewedAt'
};

exports.Prisma.WalletScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  balance: 'balance',
  currency: 'currency',
  status: 'status',
  pinHash: 'pinHash',
  pinFailures: 'pinFailures',
  pinLockedUntil: 'pinLockedUntil',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TransactionScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  type: 'type',
  status: 'status',
  amount: 'amount',
  fee: 'fee',
  netAmount: 'netAmount',
  currency: 'currency',
  reference: 'reference',
  providerRef: 'providerRef',
  description: 'description',
  metadata: 'metadata',
  counterpartyWalletId: 'counterpartyWalletId',
  reversedById: 'reversedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BankAccountScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  bankName: 'bankName',
  bankCode: 'bankCode',
  accountNumber: 'accountNumber',
  accountName: 'accountName',
  paystackRecipientCode: 'paystackRecipientCode',
  isDefault: 'isDefault',
  isVerified: 'isVerified',
  createdAt: 'createdAt'
};

exports.Prisma.MomoAccountScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  provider: 'provider',
  phoneNumber: 'phoneNumber',
  accountName: 'accountName',
  isDefault: 'isDefault',
  isVerified: 'isVerified',
  createdAt: 'createdAt'
};

exports.Prisma.EscrowScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  vendorId: 'vendorId',
  buyerWalletId: 'buyerWalletId',
  vendorWalletId: 'vendorWalletId',
  amount: 'amount',
  commission: 'commission',
  netAmount: 'netAmount',
  status: 'status',
  heldAt: 'heldAt',
  releasedAt: 'releasedAt',
  refundedAt: 'refundedAt',
  releasedTxnId: 'releasedTxnId',
  refundedTxnId: 'refundedTxnId',
  reason: 'reason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PlatformConfigScalarFieldEnum = {
  id: 'id',
  commissionRate: 'commissionRate',
  taxRate: 'taxRate',
  withdrawalFeeFlat: 'withdrawalFeeFlat',
  minTopup: 'minTopup',
  maxTopup: 'maxTopup',
  minWithdrawal: 'minWithdrawal',
  dailyWithdrawalLimit: 'dailyWithdrawalLimit',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReelScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  videoUrl: 'videoUrl',
  thumbnailUrl: 'thumbnailUrl',
  caption: 'caption',
  productId: 'productId',
  likesCount: 'likesCount',
  viewsCount: 'viewsCount',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReelLikeScalarFieldEnum = {
  id: 'id',
  reelId: 'reelId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.ServiceScalarFieldEnum = {
  id: 'id',
  vendorId: 'vendorId',
  name: 'name',
  description: 'description',
  price: 'price',
  priceDisplay: 'priceDisplay',
  imageUrl: 'imageUrl',
  category: 'category',
  rating: 'rating',
  ratingCount: 'ratingCount',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.OrderStatus = exports.$Enums.OrderStatus = {
  pending: 'pending',
  confirmed: 'confirmed',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  refunded: 'refunded'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  pending: 'pending',
  success: 'success',
  failed: 'failed',
  refunded: 'refunded'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  order: 'order',
  payment: 'payment',
  shipping: 'shipping',
  promotion: 'promotion',
  system: 'system',
  review: 'review'
};

exports.WalletStatus = exports.$Enums.WalletStatus = {
  ACTIVE: 'ACTIVE',
  FROZEN: 'FROZEN',
  SUSPENDED: 'SUSPENDED'
};

exports.TransactionType = exports.$Enums.TransactionType = {
  TOPUP: 'TOPUP',
  WITHDRAWAL: 'WITHDRAWAL',
  TRANSFER_SENT: 'TRANSFER_SENT',
  TRANSFER_RECEIVED: 'TRANSFER_RECEIVED',
  ORDER_PAYMENT: 'ORDER_PAYMENT',
  EARNINGS: 'EARNINGS',
  REVERSAL: 'REVERSAL',
  FEE: 'FEE'
};

exports.TransactionStatus = exports.$Enums.TransactionStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REVERSED: 'REVERSED'
};

exports.MomoProvider = exports.$Enums.MomoProvider = {
  MTN: 'MTN',
  VODAFONE: 'VODAFONE',
  AIRTELTIGO: 'AIRTELTIGO'
};

exports.EscrowStatus = exports.$Enums.EscrowStatus = {
  HELD: 'HELD',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  DISPUTED: 'DISPUTED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Session: 'Session',
  Account: 'Account',
  Verification: 'Verification',
  VendorProfile: 'VendorProfile',
  Category: 'Category',
  Product: 'Product',
  ProductImage: 'ProductImage',
  Wishlist: 'Wishlist',
  Cart: 'Cart',
  CartItem: 'CartItem',
  Order: 'Order',
  OrderItem: 'OrderItem',
  ShippingAddress: 'ShippingAddress',
  Payment: 'Payment',
  Coupon: 'Coupon',
  Notification: 'Notification',
  Review: 'Review',
  Conversation: 'Conversation',
  ConversationParticipant: 'ConversationParticipant',
  Message: 'Message',
  Story: 'Story',
  StoryView: 'StoryView',
  Wallet: 'Wallet',
  Transaction: 'Transaction',
  BankAccount: 'BankAccount',
  MomoAccount: 'MomoAccount',
  Escrow: 'Escrow',
  PlatformConfig: 'PlatformConfig',
  Reel: 'Reel',
  ReelLike: 'ReelLike',
  Service: 'Service'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
