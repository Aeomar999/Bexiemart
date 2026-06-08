# Validation Patterns — Per-Stack Copy-Paste Code

---

## 1. Zod (TypeScript / Node.js / Next.js / Bun / Deno)

### Base schema pattern
```typescript
import { z } from 'zod'

// ── Schema ──
export const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().trim().min(1).max(100),
  age: z.number().int().min(13).max(150).optional(),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
  avatarUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).default([]),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// ── Handler ──
export function handleCreateUser(raw: unknown) {
  const data = createUserSchema.parse(raw)
  // data is fully typed and validated
}
```

### Global error handler (Express / Hono / Next.js)
```typescript
import { ZodError } from 'zod'

export function validationErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    })
  }
  next(err)
}
```

### Coercion + transform pattern
```typescript
export const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().max(200).optional(),
})
```

### Stripping unknown fields
```typescript
// .parse() strips unknown by default in Zod v3+
const body = createUserSchema.parse(req.body)
// body only contains declared keys — safe to spread
```

### Refinement (cross-field validation)
```typescript
export const registerSchema = z.object({
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})
```

### File upload validation
```typescript
export const uploadSchema = z.object({
  file: z.instanceof(File).refine(f => f.size <= 5 * 1024 * 1024, 'Max 5MB')
    .refine(f => ['image/jpeg','image/png','image/webp'].includes(f.type), 'Unsupported type'),
})
```

---

## 2. Valibot (TypeScript — lighter alternative to Zod)

```typescript
import { object, string, number, email, minLength, maxLength, pipe, safeParse } from 'valibot'

const LoginSchema = object({
  email: pipe(string(), email(), maxLength(255)),
  password: pipe(string(), minLength(8), maxLength(128)),
})

const result = safeParse(LoginSchema, req.body)
if (!result.success) {
  return res.status(400).json({ error: result.issues })
}
```

---

## 3. Pydantic v2 (Python / FastAPI)

```python
from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import Optional
import magic  # python-magic


class CreateUserRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    email: EmailStr = Field(max_length=255)
    name: str = Field(min_length=1, max_length=100)
    age: Optional[int] = Field(default=None, ge=13, le=150)
    role: str = Field(default="user", pattern=r"^(admin|user|viewer)$")
    tags: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        for tag in v:
            if len(tag) > 50:
                raise ValueError("Tag exceeds 50 characters")
        return v


# FastAPI usage
from fastapi import FastAPI, HTTPException, UploadFile

app = FastAPI()

@app.post("/users")
async def create_user(body: CreateUserRequest):
    # body is already validated by Pydantic
    return {"email": body.email}


# File upload validation
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

@app.post("/upload")
async def upload_file(file: UploadFile):
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(400, "File too large")

    contents = await file.read(1024)
    mime = magic.from_buffer(contents, mime=True)
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, f"Unsupported type: {mime}")

    # ... process
```

---

## 4. Joi (Node.js / Express)

```javascript
const Joi = require('joi')

const createUserSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  name: Joi.string().trim().min(1).max(100).required(),
  age: Joi.number().integer().min(13).max(150).optional(),
  role: Joi.string().valid('admin', 'user', 'viewer').default('user'),
  tags: Joi.array().items(Joi.string().max(50)).max(10).default([]),
})

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({ path: d.path.join('.'), message: d.message })),
      })
    }
    req.body = value  // use sanitised value
    next()
  }
}

app.post('/users', validate(createUserSchema), handler)
```

---

## 5. Yup (React + Formik / Node.js)

```typescript
import * as yup from 'yup'

export const loginSchema = yup.object({
  email: yup.string().email().max(255).required(),
  password: yup.string().min(8).max(128).required(),
})

// React / Formik usage
<Formik validationSchema={loginSchema} onSubmit={...} />

// Server usage
await loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
```

---

## 6. Go Struct Tags + Validator

```go
package dto

import "github.com/go-playground/validator/v10"

var validate = validator.New()

type CreateUserRequest struct {
    Email string `json:"email" validate:"required,email,max=255"`
    Name  string `json:"name"  validate:"required,min=1,max=100"`
    Age   int    `json:"age"   validate:"omitempty,min=13,max=150"`
    Role  string `json:"role"  validate:"omitempty,oneof=admin user viewer"`
}

func (r *CreateUserRequest) Validate() error {
    return validate.Struct(r)
}

// Usage
func CreateUser(w http.ResponseWriter, req *http.Request) {
    var body CreateUserRequest
    if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
        http.Error(w, `{"error":"invalid json"}`, 400)
        return
    }
    if err := body.Validate(); err != nil {
        http.Error(w, `{"error":"`+err.Error()+`"}`, 400)
        return
    }
    // body is safe
}
```

---

## 7. Java / Spring Boot Jakarta Validation

```java
// pom.xml: spring-boot-starter-validation

// DTO
public record CreateUserRequest(
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 1, max = 100) String name,
    @Min(13) @Max(150) Integer age,
    @Pattern(regexp = "admin|user|viewer") String role
) {}

// Controller
@RestController
public class UserController {
    @PostMapping("/users")
    public ResponseEntity<?> createUser(
        @Valid @RequestBody CreateUserRequest body,
        BindingResult result
    ) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest().body(
                result.getFieldErrors().stream()
                    .map(e -> Map.of("field", e.getField(), "message", e.getDefaultMessage()))
                    .toList()
            );
        }
        // body is safe
        return ResponseEntity.ok().build();
    }
}

// Global exception handler
@ControllerAdvice
public class ValidationHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handle(MethodArgumentNotValidException ex) {
        // ... return 400 with field errors
    }
}
```

---

## 8. Laravel / PHP Form Request

```php
<?php
// app/Http/Requests/CreateUserRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic separately
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|max:255',
            'name'  => 'required|string|min:1|max:100',
            'age'   => 'nullable|integer|min:13|max:150',
            'role'  => 'nullable|in:admin,user,viewer',
            'tags'  => 'nullable|array|max:10',
            'tags.*' => 'string|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'An email address is required.',
            'email.email'    => 'Provide a valid email address.',
        ];
    }
}

// Controller usage
public function store(CreateUserRequest $request) {
    // $request->validated() returns only the validated data
    $data = $request->validated();
    // $data is safe
}
```

---

## 9. Ruby on Rails Strong Parameters

```ruby
# app/controllers/users_controller.rb
class UsersController < ApplicationController
  def create
    @user = User.new(user_params)
    # ...
  end

  private

  def user_params
    params.require(:user).permit(:email, :name, :age, :role, tags: [])
  end
end

# app/models/user.rb
class User < ApplicationRecord
  validates :email, presence: true, length: { maximum: 255 },
            format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name,  presence: true, length: { minimum: 1, maximum: 100 }
  validates :age,   numericality: { greater_than_or_equal_to: 13, less_than_or_equal_to: 150 },
            allow_nil: true
  validates :role,  inclusion: { in: %w[admin user viewer] }, allow_nil: true
end
```

---

## 10. Supabase Edge Functions (Deno)

```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const createProfileSchema = z.object({
  username: z.string().trim().min(3).max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscore'),
  bio: z.string().max(500).optional().default(''),
  avatar_url: z.string().url().optional().nullable(),
})

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const raw = await req.json()
  const parsed = createProfileSchema.safeParse(raw)

  if (!parsed.success) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      issues: parsed.error.issues,
    }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  // Use parameterised RPC — never interpolate parsed data into SQL
  const { data, error } = await supabase.rpc('create_profile', {
    p_username: parsed.data.username,
    p_bio: parsed.data.bio,
  })

  if (error) return new Response(error.message, { status: 500 })
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
})
```

---

## 11. Cloudflare Workers

```typescript
export interface Env {
  VALIDATION_SECRET: string
}

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(78),  // RFC 2822
  body: z.string().max(10000),
})

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Validate method
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    // Validate Content-Type
    const ct = req.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) {
      return new Response('Expected application/json', { status: 415 })
    }

    // Validate body
    const raw = await req.json()
    const parsed = emailSchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', issues: parsed.error }, { status: 400 })
    }

    // Validate secret (authorisation — separate from input validation but often conflated)
    const auth = req.headers.get('x-validation-secret')
    if (auth !== env.VALIDATION_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Safe to proceed
    return Response.json({ ok: true })
  }
}
```

---

## 12. HTML Form Validation (Client-Side — UX Only)

```html
<form id="signup" novalidate>
  <input
    type="email"
    name="email"
    required
    maxlength="255"
    pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
    title="Enter a valid email address"
  />
  <input
    type="text"
    name="name"
    required
    minlength="1"
    maxlength="100"
    pattern="^[\p{L}\s\-']+$"
  />
  <input type="number" name="age" min="13" max="150" />
  <select name="role">
    <option value="user">User</option>
    <option value="admin">Admin</option>
    <option value="viewer">Viewer</option>
  </select>
  <button type="submit">Sign Up</button>
</form>

<script>
  document.getElementById('signup').addEventListener('submit', (e) => {
    e.preventDefault()
    const form = e.target
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }
    // Send to server — server will validate AGAIN
    fetch('/api/users', {
      method: 'POST',
      body: new FormData(form),
    })
  })
</script>
```

---

## 13. Sanitisation Helpers

```typescript
// DOMPurify for rich text (server or client)
import DOMPurify from 'dompurify'

function sanitiseHtml(unsafe: string): string {
  return DOMPurify.sanitize(unsafe, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  })
}
```

```python
# Python bleach for HTML sanitisation
import bleach

def sanitise_html(unsafe: str) -> str:
    return bleach.clean(
        unsafe,
        tags=['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        attributes={'a': ['href', 'rel']},
        strip=True,
    )
```

---

## 14. URL / SSRF Validation

```typescript
import { URL } from 'node:url'

const BLOCKED_HOSTS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^\[::1\]$/,
  /^\[fc00:/i,
  /^\[fe80:/i,
  /^localhost$/i,
]

function isSafeUrl(input: string): boolean {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return false
  }

  // Protocol check
  if (!['http:', 'https:'].includes(url.protocol)) return false

  // Host check
  const host = url.hostname
  if (BLOCKED_HOSTS.some(re => re.test(host))) return false

  // DNS rebinding protection: resolve and check again
  // (omitted for brevity — use dns.lookup in production)

  return true
}
```

---

## 15. Mass Assignment Protection

```typescript
// ❌ DANGEROUS — never do this
await db.collection('users').updateOne(
  { _id: userId },
  { $set: req.body }  // user can set isAdmin=true
)

// ✅ Safe — use an explicit DTO
const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
})

const allowed = updateProfileSchema.parse(req.body)
await db.collection('users').updateOne(
  { _id: userId },
  { $set: allowed }  // only name, bio, avatarUrl can be changed
)
```

---

## 16. Path Traversal Protection

```typescript
import path from 'node:path'
import fs from 'node:fs/promises'

const ALLOWED_DIR = path.resolve('/data/uploads')

async function safeReadFile(userPath: string): Promise<Buffer> {
  // Normalise
  const full = path.resolve(ALLOWED_DIR, userPath)

  // Check prefix
  if (!full.startsWith(ALLOWED_DIR + path.sep) && full !== ALLOWED_DIR) {
    throw new Error('Path traversal detected')
  }

  // Resolve symlinks
  const real = await fs.realpath(full)
  if (!real.startsWith(ALLOWED_DIR + path.sep) && real !== ALLOWED_DIR) {
    throw new Error('Symlink escape detected')
  }

  return fs.readFile(real)
}
```

---

## 17. GraphQL Depth & Complexity Limiting

```typescript
// graphql-depth-limit (JS)
import depthLimit from 'graphql-depth-limit'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(6)],
})
```

```python
# graphene / Strawberry — query complexity
import strawberry
from strawberry.extensions import QueryDepthLimiter

schema = strawberry.Schema(
    query=Query,
    extensions=[QueryDepthLimiter(max_depth=6)],
)
```

---

## 18. File Upload Validation (Server)

```typescript
import { z } from 'zod'
import { fileTypeFromBuffer } from 'file-type'

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const MAX_SIZE = 5 * 1024 * 1024  // 5 MB

async function validateUpload(file: File): Promise<void> {
  if (file.size > MAX_SIZE) throw new Error('File exceeds 5MB limit')

  const buffer = Buffer.from(await file.arrayBuffer())
  const type = await fileTypeFromBuffer(buffer)

  if (!type || !ALLOWED_MIMES.has(type.mime)) {
    throw new Error(`Unsupported file type: ${type?.mime ?? 'unknown'}`)
  }
}
```

---

## 19. SQL Injection Prevention (Parameterised Queries)

```typescript
// ✅ SAFE — parameterised
await db.query(
  'SELECT * FROM users WHERE email = $1 AND status = $2',
  [userInput.email, 'active']
)

// ❌ DANGEROUS — interpolation
await db.query(`SELECT * FROM users WHERE email = '${userInput.email}'`)
```

```python
# ✅ SAFE — parameterised
cursor.execute(
    "SELECT * FROM users WHERE email = %s AND status = %s",
    (user_input["email"], "active")
)

# ❌ DANGEROUS — f-string
cursor.execute(f"SELECT * FROM users WHERE email = '{user_input['email']}'")
```

---

## 20. NoSQL Injection Prevention

```typescript
// ❌ DANGEROUS — operator injection
await db.collection('users').find(req.query)  // user passes { "$gt": "" }

// ✅ SAFE — strip operators before query
function sanitiseFilter(filter: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(filter)) {
    if (key.startsWith('$')) continue       // reject operators
    if (key.includes('.')) continue          // reject dotted keys
    if (typeof value === 'object' && value !== null) {
      safe[key] = sanitiseFilter(value as Record<string, unknown>)
    } else {
      safe[key] = value
    }
  }
  return safe
}

const safeFilter = sanitiseFilter(req.query)
await db.collection('users').find(safeFilter)
```
