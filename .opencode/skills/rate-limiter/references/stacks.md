# Rate Limiting Implementation Per Stack

Copy-paste ready implementations for each stack.

---

## 1. Next.js App Router (Middleware + Route Handlers)

### Middleware-based rate limiting (applies to all matching routes)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             'anonymous'
  
  const { success, limit, reset, remaining } = await ratelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
        }
      }
    )
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

### Per-route rate limiting

```typescript
// app/api/auth/login/route.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const authRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await authRatelimit.limit(`auth:${ip}`)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429 }
    )
  }
  
  // ... login logic
}
```

---

## 2. Next.js Pages Router (API Routes)

```typescript
// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
})

function getIP(req: NextApiRequest): string {
  return req.headers['x-forwarded-for'] as string ?? 
         req.socket.remoteAddress ?? 
         'anonymous'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ip = getIP(req)
  const { success, reset } = await ratelimit.limit(`auth:${ip}`)
  
  if (!success) {
    res.setHeader('Retry-After', Math.ceil((reset - Date.now()) / 1000))
    return res.status(429).json({ error: 'Too many requests' })
  }
  
  // ... login logic
}
```

---

## 3. Express.js Middleware

```javascript
// rate-limiter.js
const { Ratelimit } = require('@upstash/ratelimit')
const { Redis } = require('@upstash/redis')

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? 
         req.ip ?? 
         req.connection.remoteAddress ?? 
         'anonymous'
}

async function rateLimiter(req, res, next) {
  const ip = getIP(req)
  const identifier = req.user?.id ?? ip
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
  
  res.setHeader('X-RateLimit-Limit', limit)
  res.setHeader('X-RateLimit-Remaining', remaining)
  
  if (!success) {
    res.setHeader('Retry-After', Math.ceil((reset - Date.now()) / 1000))
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: Math.ceil((reset - Date.now()) / 1000)
    })
  }
  
  next()
}

// Export for use in specific routes
module.exports = { rateLimiter, ratelimit }

// Usage: app.use('/api/', rateLimiter)
// Or per-endpoint: app.post('/api/login', rateLimiter, loginHandler)
```

---

## 4. FastAPI (Python)

```python
# rate_limiter.py
from contextlib import asynccontextmanager
from typing import Optional
import time

import redis.asyncio as redis
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse


class SlidingWindowRateLimiter:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis: Optional[redis.Redis] = None

    async def init(self):
        self.redis = await redis.from_url(self.redis_url)

    async def close(self):
        if self.redis:
            await self.redis.close()

    async def check(self, key: str, max_requests: int, window_s: int) -> tuple[bool, int]:
        now = int(time.time() * 1000)
        window_start = now - (window_s * 1000)

        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(f"ratelimit:{key}", 0, window_start)
        pipe.zcard(f"ratelimit:{key}")
        pipe.zadd(f"ratelimit:{key}", {str(now): now})
        pipe.expire(f"ratelimit:{key}", window_s * 2)
        
        _, count, _, _ = await pipe.execute()
        
        return count <= max_requests, max_requests - count


# app.py usage
from fastapi import FastAPI, Request
from rate_limiter import SlidingWindowRateLimiter

app = FastAPI()
limiter = SlidingWindowRateLimiter()

@app.on_event("startup")
async def startup():
    await limiter.init()

@app.on_event("shutdown")
async def shutdown():
    await limiter.close()

async def rate_limit(request: Request, max_reqs: int = 10, window: int = 10):
    ip = request.headers.get("x-forwarded-for", request.client.host)
    allowed, remaining = await limiter.check(f"api:{ip}", max_reqs, window)
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many requests"
        )

@app.get("/api/example")
async def example(request: Request):
    await rate_limit(request, max_reqs=30, window=60)
    return {"message": "success"}
```

---

## 5. Supabase Edge Functions

```typescript
// supabase/functions/_shared/rate-limiter.ts
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@latest'
import { Redis } from 'https://esm.sh/@upstash/redis@latest'

export function createRateLimiter() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '10 s'),
  })
}

export function getIP(req: Request): string {
  return req.headers.get('x-forwarded-for') ?? 
         req.headers.get('x-real-ip') ?? 
         'anonymous'
}

// Usage in an edge function:
// import { createRateLimiter, getIP } from '../_shared/rate-limiter.ts'
//
// const ratelimit = createRateLimiter()
//
// Deno.serve(async (req) => {
//   const ip = getIP(req)
//   const { success } = await ratelimit.limit(ip)
//   if (!success) {
//     return new Response(JSON.stringify({ error: 'Too many requests' }), {
//       status: 429,
//       headers: { 'Content-Type': 'application/json', 'Retry-After': '10' }
//     })
//   }
//   // ... function logic
// })
```

---

## 6. Cloudflare Workers

```typescript
// wrangler.toml needs:
// [[kv_namespaces]]
// binding = "RATE_LIMIT_KV"
// id = "your-kv-id"

export interface Env {
  RATE_LIMIT_KV: KVNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const ip = request.headers.get('cf-connecting-ip') ?? 'anonymous'
    const key = `ratelimit:${ip}`
    
    const now = Date.now()
    const windowMs = 10_000 // 10 seconds
    const maxRequests = 10
    
    const entry = await env.RATE_LIMIT_KV.get(key, 'text')
    const timestamps: number[] = entry ? JSON.parse(entry) : []
    
    const windowStart = now - windowMs
    const recent = timestamps.filter(t => t > windowStart)
    
    if (recent.length >= maxRequests) {
      const oldest = recent[0]
      const retryAfter = Math.ceil((oldest + windowMs - now) / 1000)
      
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    recent.push(now)
    await env.RATE_LIMIT_KV.put(key, JSON.stringify(recent), {
      expirationTtl: Math.ceil(windowMs / 1000)
    })
    
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

---

## 7. In-Memory (Development Only)

```typescript
// rate-limiter-memory.ts
// WARNING: Only for local dev. DO NOT use in production serverless.

class InMemoryRateLimiter {
  private store = new Map<string, number[]>()
  
  async limit(key: string, maxRequests: number, windowMs: number): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now()
    const windowStart = now - windowMs
    
    let timestamps = this.store.get(key) ?? []
    timestamps = timestamps.filter(t => t > windowStart)
    
    if (timestamps.length >= maxRequests) {
      return { success: false, remaining: 0 }
    }
    
    timestamps.push(now)
    this.store.set(key, timestamps)
    
    return { success: true, remaining: maxRequests - timestamps.length }
  }
}

export const rateLimiter = new InMemoryRateLimiter()
```
