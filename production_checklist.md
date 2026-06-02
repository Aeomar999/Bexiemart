# BexieMart 100% Production Readiness Checklist & Implementation Guide

This is the master checklist + manual for taking BexieMart from its current state (v0.7) to a fully deployed, production-ready, App Store-approved application (v1.0).

Priority legend: **🔴 CRITICAL — Ship-blocking** | **🟡 HIGH — Strongly recommended** | **🟢 MEDIUM — Important post-launch**

---

## 3-Day Sprint Blitz Plan

### Day 1 — Infrastructure & Safety Net (8–10h)

| Time | Task | Area |
|------|------|------|
| 09:00 | Set production env vars in `eas.json` + EAS Secrets | Build Config |
| 09:30 | Install & configure `expo-updates` | OTA Updates |
| 10:30 | Install & configure `sentry-expo` | Error Tracking |
| 11:00 | Replace all `console.error()` → Sentry | Error Tracking |
| 12:00 | Install `husky` + `lint-staged` + Prettier | DX |
| 13:00 | Lunch | — |
| 14:00 | Add GitHub Actions CI | CI/CD |
| 14:30 | Install NetInfo + add offline banner | Offline |
| 15:00 | Add Zustand persist middleware | Offline |
| 16:00 | Configure React Query staleTime/gcTime + retry | Offline |
| 16:30 | Fix all TanStack Query v5 mutate() callbacks | Bug Fix |
| 17:30 | Fix pre-existing TS error in edit-phone.tsx | Bug Fix |
| 18:00 | Delete dev scripts, fix .gitignore | Cleanup |

### Day 2 — Auth, Logic Polish & Testing Foundation (8–10h)

| Time | Task | Area |
|------|------|------|
| 09:00 | Implement token refresh | Auth |
| 09:45 | Add Zod response validation on critical API calls | API |
| 10:30 | Add loading/skeleton/error states | UX |
| 11:30 | Consolidate WebSocket implementations | Refactor |
| 12:00 | Fix hardcoded socket URL | Refactor |
| 12:30 | Lunch | — |
| 13:30 | Set up Jest + testing-library | Testing |
| 15:00 | Write critical path store tests | Testing |
| 16:30 | Write critical hook tests | Testing |
| 17:30 | Expand Maestro E2E tests | Testing |
| 18:00 | Create .env.example | Cleanup |

### Day 3 — Observability, Security & Launch Prep (8–10h)

| Time | Task | Area |
|------|------|------|
| 09:00 | Install PostHog + init + screen tracking | Analytics |
| 09:30 | Add conversion funnel events | Analytics |
| 10:00 | Configure universal links / App Links | Deep Links |
| 10:30 | Add payment retry + idempotency keys | Payments |
| 11:00 | Verify live Paystack key routing | Security |
| 11:30 | Set up EAS auto-submit | CI/CD |
| 12:00 | Add proper Android adaptive icon | Branding |
| 12:30 | Lunch | — |
| 13:30 | App Store screenshots | Launch |
| 14:30 | Write App Store description + keywords | Launch |
| 15:00 | Create Apple reviewer test account | Launch |
| 16:00 | Full regression pass (lint, typecheck, E2E, smoke) | QA |
| 17:30 | EAS production build | Build |
| 18:00 | Submit to App Store + Play Console | Launch |

### Run in parallel (not dependent on coding)
- Privacy Policy & ToS — use a template generator, host on Netlify/GitHub Pages
- Apple Developer + Google Play Console accounts — start Day 1 if not done
- Backend deployment — provision infra Day 1 alongside coding

---

# Implementation Manual

---

## Phase 1: Core E-Commerce Engine

### Checkout & Payments

#### `[ ]` Shipping Address Management

**Backend (NestJS):**

1. Create `Address` model in Prisma schema:
```prisma
model Address {
  id          String   @id @default(cuid())
  userId      String
  label       String   // "Home", "Work", etc.
  street      String
  city        String
  state       String
  zipCode     String
  country     String   @default("GH")
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders      Order[]
}
```

2. Run migration: `npx prisma migrate dev --name add_address_model`

3. Create CRUD endpoints in NestJS:
```typescript
// src/addresses/addresses.controller.ts
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Body() dto: CreateAddressDto, @Req() req: AuthRequest) {
    return this.addressesService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.addressesService.findAll(req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAddressDto, @Req() req: AuthRequest) {
    return this.addressesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.addressesService.remove(req.user.id, id);
  }

  @Post(':id/default')
  setDefault(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.addressesService.setDefault(req.user.id, id);
  }
}
```

**Mobile (React Native):**

4. Create API module `src/lib/api/addresses.ts`:
```typescript
import { api } from "./client";

export const addressesApi = {
  getAll: () => api.get("/addresses").then((r) => r.data),
  create: (data: CreateAddressDto) => api.post("/addresses", data).then((r) => r.data),
  update: (id: string, data: UpdateAddressDto) => api.patch(`/addresses/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/addresses/${id}`).then((r) => r.data),
  setDefault: (id: string) => api.post(`/addresses/${id}/default`).then((r) => r.data),
};
```

5. Create the address list/edit screen with `react-hook-form` + Zod validation:
```typescript
// app/(customer)/addresses.tsx
const schema = z.object({
  label: z.string().min(1, "Label is required"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
});

const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

#### `[ ]` Delivery Fee Calculation

**Approach:** Use a distance-based fee or a flat-rate per region.

1. Add delivery fee config to Prisma:
```prisma
model DeliveryConfig {
  id        String   @id @default(cuid())
  city      String
  baseFee   Float
  perKmFee  Float?
  flatFee   Float?
  freeAbove Float?   // free delivery on orders above this amount
}
```

2. Create a delivery calculator service:
```typescript
// src/delivery/delivery.service.ts
async calculateFee(userId: string, addressId: string, total: number): Promise<number> {
  const address = await this.addressRepo.findById(addressId);
  const config = await this.deliveryConfigRepo.findByCity(address.city);

  if (config.freeAbove && total >= config.freeAbove) return 0;
  if (config.flatFee) return config.flatFee;
  // distance-based: compute distance from vendor to address, multiply by perKmFee
  return config.baseFee;
}
```

3. Return fee in the checkout flow — include in the order summary before payment.

#### `[ ]` Payment Gateway Integration

Already using Paystack. Verify the setup:

1. Ensure **live keys** are used for production (`EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` in EAS secrets, NOT in `.env`).
2. Test the full payment flow end-to-end with a test card on staging.
3. Handle Paystack's callback in the webview:
```typescript
// In PaystackWebView onSuccess handler
const handlePaystackSuccess = async (response: PaystackResponse) => {
  // Verify transaction on your backend
  const verified = await paymentsApi.verify(response.reference);
  if (verified.status === "success") {
    // Create order
    await ordersApi.create({ paymentReference: response.reference, addressId });
    router.replace("/(customer)/orders/success");
  }
};
```

#### `[ ]` Payment Webhooks

1. Create `/payments/webhook` endpoint on the backend (NestJS):
```typescript
@Post('webhook')
@Public()
async handleWebhook(@Headers('x-paystack-signature') signature: string, @Body() event: any) {
  // Verify signature using Paystack secret key
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(event)).digest('hex');
  if (hash !== signature) throw new UnauthorizedException();

  if (event.event === 'charge.success') {
    await this.ordersService.markAsPaid(event.data.reference);
  }
}
```

2. Expose this endpoint as public (no JWT auth). Configure Paystack dashboard to POST to `https://api.bexiemart.com/payments/webhook`.

#### `[ ]` Order Creation

```typescript
// src/orders/orders.service.ts
async create(userId: string, dto: CreateOrderDto) {
  const cart = await this.cartService.getCart(userId);
  const address = await this.addressRepo.findById(dto.addressId);
  const deliveryFee = await this.deliveryService.calculateFee(userId, dto.addressId, cart.total);

  const order = await this.prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        addressId: dto.addressId,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        subtotal: cart.total,
        deliveryFee,
        total: cart.total + deliveryFee,
        status: 'pending',
        paymentReference: dto.paymentReference,
      },
    });

    await tx.cartItem.deleteMany({ where: { cart: { userId } } });
    return order;
  });

  return order;
}
```

### Order Management

#### `[ ]` Order History Screen

```typescript
// app/(customer)/orders/index.tsx
export default function OrderHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll(),
  });

  return (
    <View className="flex-1 bg-background">
      <WhiteTabHeader title="My Orders" />
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => router.push(`/(customer)/orders/${item.id}`)}
          />
        )}
        ListEmptyComponent={!isLoading ? <EmptyOrders /> : null}
      />
    </View>
  );
}
```

#### `[ ]` Order Details Screen

```typescript
// app/(customer)/orders/[id].tsx
export default function OrderDetail({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
  });

  return (
    <ScrollView>
      <OrderStatusTracker status={data.status} />
      <OrderItemList items={data.items} />
      <PriceBreakdown subtotal={data.subtotal} delivery={data.deliveryFee} total={data.total} />
      <AddressCard address={data.address} />
    </ScrollView>
  );
}
```

#### `[ ]` Order Status Tracking

```typescript
const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

function OrderStatusTracker({ status }: { status: string }) {
  const currentIndex = STATUS_FLOW.indexOf(status);
  return (
    <View className="px-5 py-6">
      {STATUS_FLOW.map((step, i) => (
        <View key={step} className="flex-row items-center">
          <View className={`w-8 h-8 rounded-full items-center justify-center ${i <= currentIndex ? 'bg-brand-500' : 'bg-muted'}`}>
            <Icon name="check" size={14} color="white" />
          </View>
          {i < STATUS_FLOW.length - 1 && (
            <View className={`w-0.5 h-8 ml-[15px] ${i < currentIndex ? 'bg-brand-500' : 'bg-border'}`} />
          )}
          <Text className="ml-3 font-body">{STATUS_LABELS[step]}</Text>
        </View>
      ))}
    </View>
  );
}
```

### Product Discovery Polish

#### `[ ]` Search Functionality

```typescript
// src/hooks/use-search.ts
export function useSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  return {
    query,
    setQuery,
    results: useQuery({
      queryKey: ['search', debouncedQuery],
      queryFn: () => productsApi.search(debouncedQuery),
      enabled: debouncedQuery.length >= 2,
    }),
  };
}
```

#### `[ ]` Filtering & Sorting

```typescript
// app/(customer)/(shop)/index.tsx  — existing screen, add filter bar
const [filters, setFilters] = useState({ category: null, minPrice: null, maxPrice: null });
const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

const { data } = useQuery({
  queryKey: ['products', filters, sortBy],
  queryFn: () => productsApi.getAll({ ...filters, sort: sortBy }),
});
```

#### `[ ]` Pagination / Infinite Scroll

```typescript
export function useProductList(filters: ProductFilters) {
  return useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam = 1 }) => productsApi.getAll({ ...filters, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length + 1 : undefined,
    initialPageParam: 1,
  });
}

// Usage in FlatList:
<FlatList
  data={data?.pages.flatMap(p => p.items)}
  onEndReached={() => hasNextPage && fetchNextPage()}
  onEndReachedThreshold={0.5}
/>
```

---

## Phase 2: User Retention & Experience

### Push Notifications

#### `[ ]` Expo Push Notification Setup

```bash
npx expo install expo-notifications expo-device
```

```typescript
// src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const token = await Notifications.getExpoPushTokenAsync();
  // Send token to your backend
  await api.post('/users/push-token', { token: token.data });
}
```

```typescript
// app/_layout.tsx — handle incoming notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

#### `[ ]` Transactional Notifications

Send from the backend when order status changes:
```typescript
// In order service, after status update:
import { Expo } from 'expo-server-sdk';
const expo = new Expo();

await expo.sendPushNotificationsAsync([{
  to: user.pushToken,
  title: 'Order Shipped!',
  body: `Your order #${order.id} is on its way.`,
  data: { screen: 'order', orderId: order.id },
}]);
```

#### `[ ]` Marketing Notifications

Use a scheduled job (e.g., `@nestjs/schedule`) to check for abandoned carts and send reminders 24h later.

### App Polish

#### `[ ]` App Icon & Splash Screen

**Icon:**
1. Create a 1024×1024 PNG with no transparency for iOS. Name it `icon.png` (iOS) and `icon-adaptive-foreground.png` (Android).
2. Configure in `app.json`:
```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon-adaptive-foreground.png",
        "backgroundColor": "#004CFF"
      }
    }
  }
}
```
3. Run `npx expo build` — Expo auto-generates all required sizes from the 1024×1024 source.

**Splash Screen (already partially set up):**
- Verify `expo-splash-screen` config in `app.json`:
```json
{
  "expo": {
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#004CFF"
    }
  }
}
```
- Ensure the animated splash in `_layout.tsx` transitions cleanly from the native splash.

#### `[ ]` Deep Linking

**Custom scheme** (already set: `bexiemart://`).

**Universal Links (iOS):**
1. Add `apple-app-association` file to your backend's `/.well-known/` directory:
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.bexiemart.app",
      "paths": ["*"]
    }]
  }
}
```
2. Configure in `app.json`:
```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:api.bexiemart.com"]
    }
  }
}
```

**Android App Links:**
1. Add `assetlinks.json` to `/.well-known/` on your backend.
2. Configure in `app.json`:
```json
{
  "expo": {
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "data": [{ "scheme": "https", "host": "api.bexiemart.com", "pathPrefix": "/product/" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}
```

#### `[ ]` Offline Handling

See Phase 5 — Zustand persist + NetInfo + React Query cache.

#### `[ ]` Image Optimization

```typescript
// Replace <Image> with <ExpoImage> for automatic caching + placeholder
import { Image } from 'expo-image';

<Image
  source={{ uri: product.image }}
  style={{ width: 200, height: 200 }}
  placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**14D%3R*' }}
  contentFit="cover"
  cachePolicy="memory-disk"
/>
```

Ensure your CDN (Cloudinary, Uploadthing, or direct S3) serves WebP/AVIF with proper cache headers. Configure on the backend:
```typescript
// URL transform for CDN images
function optimizedImageUrl(url: string, width: number) {
  // Cloudinary example:
  return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
}
```

---

## Phase 3: Vendor / Admin Operations

#### `[ ]` Admin Dashboard (Web)

This is a separate project. Minimum viable:
```bash
# Create a minimal Next.js app
npx create-next-app@latest bexiemart-admin --typescript
```

Key features:
- Login with admin credentials (share the auth DB or use a separate JWT)
- View all users, vendors, orders
- Manage product categories
- View revenue reports

Wire it to the same backend API with an admin guard:
```typescript
// NestJS guard
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    return req.user?.role === 'admin';
  }
}
```

#### `[ ]` Product Management

Vendor-side is already partially built (`app/(vendor)/(products)/`). Ensure:
- Vendors can add/edit/delete their own products (check the existing screens)
- Admin can manage all products via the web dashboard
- Soft-delete support (`deletedAt` field in Prisma model)

#### `[ ]` Order Fulfillment

Vendor dashboard order list with status update buttons:
```typescript
// app/(vendor)/orders/index.tsx
const { mutate: updateStatus } = useMutation({
  mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
    ordersApi.updateStatus(orderId, status),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-orders'] }),
});
```

#### `[ ]` Payouts System (Multi-vendor)

Prisma model:
```prisma
model Payout {
  id         String   @id @default(cuid())
  vendorId   String
  amount     Float
  status     PayoutStatus @default(pending)
  periodStart DateTime
  periodEnd   DateTime
  paidAt     DateTime?
  createdAt  DateTime @default(now())
}

enum PayoutStatus {
  pending
  processing
  paid
  failed
}
```

Cron job runs weekly: calculates each vendor's earnings from completed orders, creates Payout records, triggers payment via Paystack bulk transfer API.

---

## Phase 4: Backend Security & Production Infrastructure

### Security

#### `[ ]` Rate Limiting

```bash
npm install @nestjs/throttler
```

```typescript
// src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,      // 1 minute window
      limit: 30,       // 30 requests per minute
    }]),
  ],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
```

Override on auth endpoints to be stricter (5 requests/min for login):
```typescript
@SkipThrottle()         // remove global guard
@Throttle({ default: { ttl: 60000, limit: 5 } }) // 5/min
@Post('login')
async login(@Body() dto: LoginDto) {}
```

#### `[ ]` Input Validation & Sanitization

Already using `class-validator` + `class-transformer` with DTOs (standard NestJS pattern). Audit for any endpoints missing validation:
```typescript
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;
}
```

#### `[ ]` CORS & Helmet

```bash
npm install helmet
```

```typescript
// src/main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['https://bexiemart.com'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  app.use(helmet());

  await app.listen(3000);
}
```

#### `[ ]` Secret Management

- All secrets in production should be **environment variables** set on the hosting platform (Render, Railway, AWS).
- Never commit `.env` files (add to `.gitignore`).
- Use EAS Secrets for mobile build secrets: `eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.bexiemart.com"`

### Deployment & Monitoring

#### `[ ]` Backend Hosting

**Render (easiest):**
```yaml
# render.yaml (infrastructure-as-code)
services:
  - type: web
    name: bexiemart-api
    env: node
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: DATABASE_URL
        sync: false  # set in Render dashboard
      - key: NODE_ENV
        value: production
```

**Railway:** `npx railway init` at the backend root, then `railway up`.

#### `[ ]` Production Database

Provision on **Neon** (serverless Postgres, free tier available):
```bash
# Copy the connection string from Neon dashboard
# Set as DATABASE_URL in Render/Railway env vars
npx prisma db push   # for initial schema
# or
npx prisma migrate deploy  # for production migrations
```

Never run `prisma db push` on a production database after initial setup — use `prisma migrate deploy` instead.

#### `[ ]` Error Tracking (Sentry)

**Backend:**
```bash
npm install @sentry/nestjs @sentry/profiling-node
```

```typescript
// src/main.ts
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
});
```

**Mobile:** See Phase 5.

#### `[ ]` Analytics

PostHog (see Phase 5) or a simpler alternative. For the backend:
```typescript
// src/analytics/analytics.service.ts
export class AnalyticsService {
  async trackOrderCreated(order: Order) {
    await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.POSTHOG_API_KEY,
        event: 'order_created',
        properties: { orderId: order.id, total: order.total },
        distinct_id: order.userId,
      }),
    });
  }
}
```

---

## Phase 5: Mobile App Hardening

### 🔴 Build & Deployment Configuration

#### `[x]` Set production env vars in `eas.json`

Edit `eas.json` to add the production env section:
```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.bexiemart.com/api",
        "EXPO_PUBLIC_SOCKET_URL": "https://api.bexiemart.com",
        "EXPO_PUBLIC_SENTRY_DSN": "https://xxx@sentry.io/xxx",
        "EXPO_PUBLIC_POSTHOG_API_KEY": "phc_xxx",
        "EXPO_PUBLIC_POSTHOG_HOST": "https://app.posthog.com",
        "EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY": "pk_live_xxx"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

**Better approach — use EAS Secrets** (so values aren't in the repo):
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.bexiemart.com/api"
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://xxx@sentry.io/xxx"
# ... repeat for all env vars

# Then in eas.json, omit the values but reference by name:
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "$EXPO_PUBLIC_API_URL",
    "EXPO_PUBLIC_SENTRY_DSN": "$EXPO_PUBLIC_SENTRY_DSN"
  }
}
```

#### `[x]` Install and configure `expo-updates`

```bash
npx expo install expo-updates
```

Add to `app.json`:
```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 10000,
      "url": "https://u.expo.dev/a830e794-6932-47fd-9779-9b1317c59f3f"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

In `_layout.tsx`, wire the ErrorBoundary to trigger an OTA update check on crash recovery:
```typescript
import * as Updates from 'expo-updates';

// In ErrorBoundary reset logic:
async function handleReset() {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // fallback: just reset state
    resetState();
  }
}
```

Publish updates: `npx expo export --platform ios --output-dir dist && npx eas update --branch production --message "Hotfix: fix checkout crash"`

#### `[ ]` Configure universal links / App Links

See Phase 2 App Polish section above.

#### `[x]` Remove `debug.keystore` from repo

```bash
git rm --cached android/app/debug.keystore
echo "android/app/debug.keystore" >> .gitignore
git commit -m "chore: remove debug keystore from repo"
```

### 🔴 Testing (Zero Coverage Currently)

#### `[ ]` Set up Jest + testing-library

```bash
npm install --save-dev jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterSetup: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@sentry/.*)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

#### `[ ]` Write unit tests for Zustand stores

Example — auth store test:
```typescript
// src/lib/stores/__tests__/auth-store.test.ts
import { useAuthStore } from '../auth-store';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('should set user on login', () => {
    const mockUser = { id: '1', email: 'test@test.com' };
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('should clear state on logout', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'test@test.com' });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
```

Example — cart store test:
```typescript
// src/lib/stores/__tests__/cart-store.test.ts
import { useCartStore } from '../cart-store';
import { act } from '@testing-library/react-native';

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], total: 0 });
  });

  it('should add item to cart', () => {
    act(() => {
      useCartStore.getState().addItem({ productId: 'p1', name: 'Test', price: 10, quantity: 1 });
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().total).toBe(10);
  });

  it('should remove item from cart', () => {
    act(() => {
      useCartStore.getState().addItem({ productId: 'p1', name: 'Test', price: 10, quantity: 1 });
    });
    act(() => {
      useCartStore.getState().removeItem('p1');
    });
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().total).toBe(0);
  });
});
```

Run: `npx jest` or `npm test`

#### `[ ]` Write unit tests for React Query hooks

Use `@testing-library/react-hooks` pattern with a wrapper:
```typescript
// src/lib/hooks/__tests__/useLogin.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin } from '../useAuth';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

jest.mock('@/lib/api/auth', () => ({
  authApi: {
    login: jest.fn().mockResolvedValue({ user: { id: '1' }, token: 'abc' }),
  },
}));

describe('useLogin', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => { result.current.mutate({ email: 'test@test.com', password: 'pass123' }); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.user.id).toBe('1');
  });
});
```

#### `[ ]` Expand Maestro E2E tests

```yaml
# tests/e2e/checkout-flow.yaml
appId: com.bexiemart.app
---
- launchApp
- assertVisible: "Shop"
- tapOn: "Shop"
- tapOn:
    id: "product-card-0"
- tapOn: "Add to Cart"
- assertVisible: "Cart (1)"
- tapOn: "Cart"
- tapOn: "Checkout"
- assertVisible: "Select Address"
- tapOn: "Add New Address"
- tapOn:
    id: "address-street"
- inputText: "123 Main St"
- tapOn: "Save Address"
- tapOn: "Proceed to Payment"
- assertVisible: "Pay with Paystack"
```

Run: `npx maestro test tests/e2e/checkout-flow.yaml`

### 🔴 Error Monitoring & Observability

#### `[x]` Install and configure `sentry-expo`

```bash
npx expo install sentry-expo
```

Create `src/lib/sentry.ts`:
```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_ENV || 'development',
  tracesSampleRate: 1.0,
  enableInExpoDevelopment: true,
});
```

In `app/_layout.tsx`:
```typescript
import './src/lib/sentry'; // init before anything else
```

In `app.json`:
```json
{
  "expo": {
    "plugins": [
      "sentry-expo"
    ]
  }
}
```

Add source map upload to EAS build:
```json
{
  "build": {
    "production": {
      "env": {
        "SENTRY_AUTH_TOKEN": "$SENTRY_AUTH_TOKEN"
      }
    }
  }
}
```

#### `[x]` Replace all `console.error()` calls

Find all occurrences:
```bash
npx rg "console.error" --include "*.ts" --include "*.tsx" src/
```

Replace each with a Sentry-aware logger. Create `src/lib/logger.ts`:
```typescript
import * as Sentry from 'sentry-expo';

export const logger = {
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    if (__DEV__) {
      console.error(message, error);
    } else {
      Sentry.captureException(error || new Error(message), {
        extra: context,
      });
    }
  },
  info: (message: string, data?: Record<string, unknown>) => {
    if (__DEV__) console.log(message, data);
    else Sentry.addBreadcrumb({ message, data });
  },
};
```

Batch edit — replace all `console.error(...)` in stores:
```bash
# Manual pass: for each file, replace console.error with logger.error
# Example for one file:
# sed -i 's/console\.error(/logger.error(/g' src/lib/stores/auth-store.ts
```

Pattern:
```typescript
// Before:
try { ... } catch (error) {
  console.error("Failed to login", error);
}

// After:
try { ... } catch (error) {
  logger.error("Failed to login", error);
}
```

#### `[x]` Add Sentry breadcrumb tracking

```typescript
// In navigation or at the router level:
import * as Sentry from 'sentry-expo';
import { usePathname } from 'expo-router';

export function useTrackNavigation() {
  const pathname = usePathname();
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${pathname}`,
      level: 'info',
    });
  }, [pathname]);
}

// Add to _layout.tsx
useTrackNavigation();
```

### 🟡 Auth & Security

#### `[ ]` Implement token refresh mechanism

In `src/lib/api/client.ts`:
```typescript
import { authApi } from './auth';

let failedQueue: Array<{ resolve: Function; reject: Function }> = [];
let isRefreshing = false;

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('bexiemart_refresh_token');
        const response = await authApi.refresh(refreshToken!);
        const { token: newToken, refreshToken: newRefresh } = response.data;

        await SecureStore.setItemAsync('bexiemart_token', newToken);
        await SecureStore.setItemAsync('bexiemart_refresh_token', newRefresh);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await SecureStore.deleteItemAsync('bexiemart_token');
        await SecureStore.deleteItemAsync('bexiemart_refresh_token');
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

#### `[ ]` Add request retry with exponential backoff

In `src/lib/api/client.ts` after creating the axios instance:
```typescript
// React Query global retry config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 1000 * 60 * 5,   // 5 minutes
      gcTime: 1000 * 60 * 30,      // 30 minutes
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
```

For axios-level retry (non-React Query calls):
```bash
npm install axios-retry
```

```typescript
import axiosRetry from 'axios-retry';
axiosRetry(api, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
```

#### `[ ]` Add API response validation

Use Zod to validate critical API responses at the client layer:
```typescript
// src/lib/schemas/api-responses.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  description: z.string().nullable(),
  images: z.array(z.string().url()),
  vendorId: z.string(),
  category: z.string(),
  stock: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const OrderSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered']),
  total: z.number().positive(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })),
});

// Usage in API module:
import { ProductSchema } from '@/lib/schemas/api-responses';

export const productsApi = {
  getById: async (id: string) => {
    const { data } = await api.get(`/products/${id}`);
    return ProductSchema.parse(data); // throws if shape is wrong
  },
};
```

### 🟡 Offline & Data Resilience

#### `[x]` Install `@react-native-community/netinfo`

```bash
npx expo install @react-native-community/netinfo
```

Create a hook:
```typescript
// src/hooks/useNetwork.ts
import { useCallback, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetwork() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  return { isConnected };
}
```

Create an offline banner component:
```typescript
// src/components/ui/OfflineBanner.tsx
import { View, Text } from 'react-native';
import { useNetwork } from '@/hooks/useNetwork';

export function OfflineBanner() {
  const { isConnected } = useNetwork();
  if (isConnected) return null;

  return (
    <View className="bg-red-500 px-4 py-2">
      <Text className="text-white text-center font-bold text-sm">
        No internet connection — some features may be unavailable
      </Text>
    </View>
  );
}
```

Add to `app/_layout.tsx`:
```typescript
export default function RootLayout() {
  return (
    <>
      <OfflineBanner />
      <Stack />
    </>
  );
}
```

#### `[x]` Add Zustand persist middleware

```bash
npm install zustand/middleware
```

```typescript
// src/lib/stores/auth-store.ts — with persist
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
```

Apply the same pattern to cart, favorites, and any other store that should persist.

#### `[ ]` Add offline API request queue

```typescript
// src/lib/offline-queue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetwork } from '@/hooks/useNetwork';

interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: unknown;
  createdAt: number;
}

const QUEUE_KEY = 'offline-request-queue';

export async function enqueueRequest(request: Omit<QueuedRequest, 'id' | 'createdAt'>) {
  const queue = await getQueue();
  queue.push({ ...request, id: `${Date.now()}`, createdAt: Date.now() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function flushQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return;

  for (const req of queue) {
    try {
      await api({ method: req.method, url: req.url, data: req.data });
    } catch {
      // Re-queue if still offline
      return;
    }
  }
  await AsyncStorage.removeItem(QUEUE_KEY);
}

async function getQueue(): Promise<QueuedRequest[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Call flushQueue() in useNetwork when connection restores
```

### 🟡 App Logic Polish

#### `[x]` Audit TanStack Query v5 `mutate()` callbacks

Find all occurrences:
```bash
npx rg "\.mutate\(" --include "*.ts" --include "*.tsx" src/
```

For each, if `mutate(variables, { onSuccess: ..., onError: ... })` is used, it must be refactored. The v5 pattern:
```typescript
// ❌ DEPRECATED (silently ignored in v5)
const mutation = useMutation({ mutationFn });
mutation.mutate(data, { onSuccess: () => { ... } });

// ✅ CORRECT v5 pattern
const mutation = useMutation({
  mutationFn,
  onSuccess: () => { ... },     // moved to useMutation options
  onError: () => { ... },
});
mutation.mutate(data);          // no callbacks here
```

Alternatively, use `mutateAsync` with `await`:
```typescript
const handleSubmit = async () => {
  try {
    await mutation.mutateAsync(data);
    onClose(); // handle side-effects in the component
  } catch {
    // error already handled by useMutation onError
  }
};
```

#### `[x]` Remove dev scripts from project root

```bash
git rm fix_chat.js add-missing.js refactor-back.js update-empty-states.js add_hook.js fix-imports.js
git commit -m "chore: remove development scripts from project root"
```

#### `[x]` Fix pre-existing TypeScript error

File: `app/(customer)/edit-phone.tsx:33`
```typescript
// Likely calling sendVerificationCode which doesn't exist on the type
// Fix: check the actual API method name and correct
const { mutate: sendCode } = useMutation({
  mutationFn: (phone: string) => authApi.sendVerificationCode(phone),
  // was: mutationFn: (phone: string) => authApi.sendVerificationCode(phone),
});
```

#### `[ ]` Consolidate WebSocket implementations

`src/lib/stores/socket-store.ts` uses socket.io-client. `app/(vendor)/inbox/[id].tsx` uses raw WebSocket.

Choose socket.io-client (it's already set up with reconnection, event-based messaging):
```typescript
// app/(vendor)/inbox/[id].tsx — replace raw WebSocket with socket.io
import { useSocket } from '@/lib/stores/socket-store';

export default function InboxScreen() {
  const socket = useSocket((s) => s.socket);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join:chat', { chatId: id });
    socket.on('message', handleNewMessage);
    return () => { socket.off('message', handleNewMessage); };
  }, [socket, id]);
}
```

#### `[ ]` Fix hardcoded socket URL

```typescript
// app/(vendor)/inbox/[id].tsx — line ~9
// Before:
const socket = new WebSocket(`${process.env.EXPO_PUBLIC_SOCKET_URL || 'ws://localhost:3000'}/ws`);
// After:
import { ENV } from '@/config';
const socket = new WebSocket(`${ENV.SOCKET_URL}/ws`);
```

Make sure `SOCKET_URL` is exported from `src/config.ts`. If you're consolidating to socket.io-client (above), this file won't need raw WebSocket at all.

#### `[x]` Add `dist/` to `.gitignore`

```bash
echo "dist/" >> .gitignore
git rm -r --cached dist/ 2>/dev/null || true
git commit -m "chore: add dist to gitignore"
```

### 🟢 Code Quality & CI/CD

#### `[x]` Add GitHub Actions workflow

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  lint-typecheck-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
          cache-dependency-path: apps/mobile/package-lock.json
      - run: npm ci
      - run: npx expo lint
      - run: npx tsc --noEmit
      - run: npm test -- --coverage
```

#### `[ ]` Add EAS Build + Submit workflow

Create `.github/workflows/eas-build.yml`:
```yaml
name: EAS Build
on:
  push:
    branches: [release/*]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
        working-directory: apps/mobile
      - run: npx eas build --profile production --platform all --non-interactive
        working-directory: apps/mobile
      - run: npx eas submit --profile production --platform all --non-interactive
        working-directory: apps/mobile
```

#### `[ ]` Add husky + lint-staged

```bash
npx husky init
npm install --save-dev lint-staged
```

In `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yaml}": ["prettier --write"]
  }
}
```

In `.husky/pre-commit`:
```bash
npx lint-staged
```

#### `[ ]` Add commitlint

```bash
npm install --save-dev @commitlint/config-conventional @commitlint/cli
echo "export default { extends: ['@commitlint/config-conventional'] }" > commitlint.config.js
```

In `.husky/commit-msg`:
```bash
npx --no -- commitlint --edit $1
```

#### `[ ]` Add Prettier config

Create `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100
}
```

#### `[ ]` Configure ESLint beyond defaults

Create `.eslintrc.js`:
```javascript
module.exports = {
  extends: ['expo'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

#### `[ ]` Remove unused permissions

Audit `app.json` — remove any permission strings not used:
```json
{
  "expo": {
    "android": {
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
        // Remove "RECORD_AUDIO" if not used
      ]
    }
  }
}
```

#### `[ ]` Set up centralized permission manager

```typescript
// src/hooks/usePermission.ts
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

export function usePermission() {
  const requestCamera = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Needed',
        'Please enable camera access in Settings to take photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const requestGallery = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Gallery Permission Needed',
        'Please enable photo library access in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  return { requestCamera, requestGallery };
}
```

### 🟢 Analytics & Feature Flags

#### `[ ]` Install and initialize PostHog

```bash
npx expo install posthog-react-native
```

Create `src/lib/analytics.ts`:
```typescript
import PostHog from 'posthog-react-native';

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY!,
  {
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  }
);
```

In `app/_layout.tsx`:
```typescript
import { posthog } from '@/lib/analytics';
import { usePathname } from 'expo-router';

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    posthog.capture('$screen_view', { screen: pathname });
  }, [pathname]);

  useEffect(() => {
    posthog.startSession();
    return () => posthog.stopSession();
  }, []);

  // ... rest of layout
}
```

#### `[ ]` Add conversion funnel events

```typescript
// In product listing — when user views product
posthog.capture('product_viewed', { productId, productName, category });

// In cart — when item is added
posthog.capture('add_to_cart', { productId, quantity, price });

// When user starts checkout
posthog.capture('checkout_started', { cartTotal, itemCount });

// On payment success
posthog.capture('payment_completed', { orderId, amount, paymentMethod });
```

### 🟢 Push Notifications

See Phase 2 above.

### 🟢 Payment Hardening

#### `[ ]` Verify live Paystack key routing

In `src/config.ts`:
```typescript
export const ENV = {
  PAYSTACK_PUBLIC_KEY: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
};

// Add assertion that fails loudly in production if missing
if (process.env.EXPO_PUBLIC_ENV === 'production' && !ENV.PAYSTACK_PUBLIC_KEY) {
  throw new Error('PAYSTACK_PUBLIC_KEY is not set for production!');
}
```

#### `[ ]` Add payment retry logic

```typescript
// In checkout hook
const { mutateAsync: verifyPayment } = useMutation({
  mutationFn: (reference: string) => paymentsApi.verify(reference),
  retry: 3,
  retryDelay: 2000,
});

const handlePaymentSuccess = async (response: PaystackResponse) => {
  try {
    await verifyPayment(response.reference);
    // proceed with order creation
  } catch {
    Alert.alert(
      'Payment Verification Failed',
      'Your payment may still have been processed. Please check your orders or contact support.',
      [{ text: 'OK' }]
    );
  }
};
```

### 🟢 Internationalization

```bash
npm install i18next react-i18next
```

```typescript
// src/lib/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
```

In `app/_layout.tsx`:
```typescript
import '@/lib/i18n';
```

Usage:
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// Instead of: <Text>Add to Cart</Text>
// Use: <Text>{t('cart.add_button')}</Text>
```

---

## Phase 6: App Store & Google Play Launch

#### `[ ]` Apple Developer Account & Google Play Console

- Apple Developer Program: $99/year at https://developer.apple.com/programs
- Google Play Console: $25 one-time at https://play.google.com/console
- Both take 24-48 hours to verify.

#### `[ ]` Privacy Policy & Terms of Service

Use a generator like [Termly](https://termly.io) or [PrivacyPolicies.com](https://privacypolicies.com). Include:
- What data you collect (name, email, address, payment info)
- How data is stored and used
- Third-party services (Paystack, Sentry, PostHog)
- User rights (GDPR if targeting EU users)
- Contact information

Host the documents on a public URL (GitHub Pages, Netlify, or your backend's `/privacy` endpoint).

#### `[ ]` EAS Build

```bash
cd apps/mobile
eas build --profile production --platform all
```

For iOS, make sure:
- App Store Connect has a new app entry with the bundle ID `com.bexiemart.app`
- Distribution certificate and provisioning profile are set up (EAS handles this with `eas credentials`)

For Android:
- Upload key generated (EAS handles or you can provide one)

#### `[ ]` Configure app icons

iOS: 1024×1024 PNG, no transparency, named `icon.png` in `assets/images/`.
Android: 1024×1024 foreground PNG (`icon-adaptive-foreground.png`) + background color in `app.json`.

Both are auto-scaled by Expo during build.

#### `[ ]` Store Metadata

**App Store:**
- App name: BexieMart
- Subtitle: "Shop Local, Sell Global"
- Description: 1-2 paragraphs + bullet features
- Keywords: ecommerce, marketplace, shopping, local vendors, delivery
- Screenshots: 6.7" iPhone (1290×2796) — 6 screenshots of key screens (Home, Shop, Cart, Checkout, Orders, Profile)
- Promotional text: "Discover unique products from local vendors near you."

**Play Store:**
- Short description (80 chars): "Shop from local vendors, order delivery, and manage your store."
- Full description (4000 chars): expanded version of App Store description
- Feature graphic: 1024×500 PNG
- Screenshots: same as iOS

#### `[ ]` Create Apple reviewer test account

Create a test user in your backend/database with pre-populated data:
```sql
-- Seed a test account for App Review
INSERT INTO users (id, email, password, role, name)
VALUES ('review-account', 'review@bexiemart.com', '$2a$10$...', 'customer', 'App Review Tester');
```

Provide the login credentials in App Store Connect's "Review Notes" section along with any specific instructions (e.g., "Use test card 4084 0840 8408 4084 for payments").

#### `[ ]` Submit & Launch

```bash
# Trigger EAS Submit
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

After submitting:
- Monitor App Store Connect / Play Console for review status
- Respond to any review queries within 24 hours
- Once approved, manually release the version

---

## Summary

| Phase | 🔴 Critical | 🟡 High | 🟢 Medium | Total |
|-------|-------------|---------|-----------|-------|
| 1: Core E-Commerce Engine | — | 11 | — | **11** |
| 2: User Retention & Experience | — | — | 7 | **7** |
| 3: Vendor / Admin Operations | — | 4 | — | **4** |
| 4: Backend Security & Infrastructure | — | 8 | — | **8** |
| 5: Mobile App Hardening | 16 | 13 | 19 | **48** |
| 6: App Store & Google Play Launch | — | — | 7 | **7** |
| **Total** | **16** | **36** | **33** | **85** |

> [!TIP]
> **Where to start:** Tackle **Phase 1** (Checkout & Payments) as the core revenue path, then hit the **🔴 Phase 5 items** (build config, testing, Sentry) before any user-facing launch. Without Sentry and OTA updates, you have no visibility into production crashes and no way to fix them quickly.
