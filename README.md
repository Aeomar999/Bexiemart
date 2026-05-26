# BexieMart

BexieMart is a campus marketplace mobile application connecting student vendors with campus customers in Ghana. It facilitates product listings, order management, mobile money integration, and seamless payments.

## Tech Stack
- **Frontend (Mobile)**: React Native, Expo, NativeWind (Tailwind CSS), Zustand, React Query.
- **Backend**: NestJS, Prisma ORM, PostgreSQL.
- **Authentication**: Better Auth.
- **Payments**: Paystack (Card & Mobile Money).

## Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (Local or Cloud e.g., Neon, Supabase)
- **Expo CLI** (for mobile development)

## Project Structure
This is a monorepo containing both the frontend and backend applications:
- `/apps/server` - NestJS Backend
- `/apps/mobile` - React Native (Expo) Frontend
- `/packages/shared` - Shared types/utilities (if applicable)

---

## 1. Backend Setup (`/apps/server`)

### Environment Variables
Navigate to `apps/server` and create a `.env` file based on the following template (or copy `.env.example` if available):

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/bexiemart"

# Better Auth Configuration
BETTER_AUTH_SECRET="generate-a-strong-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_API_KEY="ba_your_api_key_here"

# Server Port
PORT=3000

# Paystack (Payments)
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Installation & Database Setup
```bash
cd apps/server

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations (creates tables based on schema)
npx prisma migrate dev

# (Optional) Seed the database if a seed script is configured
# npm run seed
```

### Running the Server
```bash
# Start in development mode with hot-reload
npm run start:dev

# Start in production mode
npm run build
npm run start:prod
```
The API will be available at `http://localhost:3000`.

### API Documentation (Swagger UI)
BexieMart includes an auto-generated Swagger UI for exploring and testing the API endpoints.

Once the backend server is running (`npm run start:dev`), open your web browser and navigate to:
**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

From the Swagger UI, you can view all available routes, request payloads, response schemas, and test API calls directly.

---

## 2. Frontend Setup (`/apps/mobile`)

### Environment Variables
Navigate to `apps/mobile` and create a `.env` file:

```env
# Use your computer's local IP address (e.g., 192.168.x.x) so your physical device can connect to the backend.
# Do NOT use localhost or 127.0.0.1 if testing on a physical phone.
EXPO_PUBLIC_API_URL="http://<YOUR_LOCAL_IP>:3000/api"

# Paystack Public Key
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
```

### Installation
```bash
cd apps/mobile

# Install dependencies
npm install
```

### Running the App
```bash
# Start the Expo development server
npm run start

# To run on iOS simulator (requires macOS)
npm run ios

# To run on Android emulator (requires Android Studio)
npm run android
```
Once the Expo server is running, you can scan the QR code using the **Expo Go** app on your physical iOS or Android device.

---

## 3. Paystack & Webhooks Setup (Local Development)

BexieMart relies on Paystack for processing payments (Cards & Mobile Money). Paystack communicates payment successes/failures via **Webhooks**.

Since Paystack cannot send webhooks to `localhost`, you must use a tunneling service like [ngrok](https://ngrok.com/) during development.

1. **Install and run ngrok** on port 3000:
   ```bash
   ngrok http 3000
   ```
2. **Update Paystack Dashboard**: 
   Go to your Paystack Settings -> API Keys & Webhooks. Set the **Test Webhook URL** to:
   `https://<your-ngrok-url>.ngrok.io/webhooks/paystack`
3. Webhooks for top-ups, order payments, and vendor withdrawals will now reach your local NestJS server.

*For detailed Paystack configuration (compliance, live mode, etc.), see `docs/bexiemart-paystack-setup-manual.md`.*

---

## Troubleshooting

- **Mobile App Cannot Connect to API**: Ensure your phone and computer are on the same Wi-Fi network. Make sure `EXPO_PUBLIC_API_URL` uses your computer's IPv4 address, not `localhost`.
- **Database Connection Issues**: Verify your `DATABASE_URL` in `apps/server/.env` is correct and your Postgres instance is running.
- **Missing Prisma Types**: If you change the database schema, make sure to re-run `npx prisma generate` and `npx prisma migrate dev` in the server directory.
