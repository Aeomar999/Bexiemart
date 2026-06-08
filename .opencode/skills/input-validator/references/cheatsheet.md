# Input Validation Cheat Sheet

## Common Regex Patterns

| Field | Pattern | Notes |
|-------|---------|-------|
| Email | `^[^\s@]+@[^\s@]+\.[^\s@]+$` | Use library for RFC compliance |
| UUID v4 | `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` | Case-insensitive |
| URL | `^https?:\/\/` | Validate with `new URL()` |
| Alphanumeric | `^[a-zA-Z0-9_]+$` | Underscore optional |
| Phone (E.164) | `^\+[1-9]\d{1,14}$` | No spaces or dashes |
| Hex color | `^#([0-9a-fA-F]{3}\|[0-9a-fA-F]{6})$` | `#fff` or `#ffffff` |
| IP v4 | `^(?:(?:25[0-5]\|2[0-4]\d\|[01]?\d\d?)\.){3}(?:25[0-5]\|2[0-4]\d\|[01]?\d\d?)$` | Nil |
| Slug | `^[a-z0-9]+(?:-[a-z0-9]+)*$` | kebab-case |
| ISO 8601 date | `^\d{4}-\d{2}-\d{2}$` | Extend for time |
| Numeric string | `^\d+$` | Digits only |

## OWASP Top 10 — Input Validation Relevance

| A# | Category | Validation role |
|----|----------|-----------------|
| A01 | Broken Access Control | Validate resource ownership + role |
| A03 | Injection | Schema validate + parameterised queries + output encode |
| A04 | Insecure Design | Validate business rules at the domain layer |
| A05 | Security Misconfiguration | Validate env vars and feature flags on boot |
| A06 | Vulnerable Components | Validate dependency hashes in CI |
| A07 | ID & Auth Failure | Validate tokens, rate-limit auth endpoints |
| A08 | Data Integrity Failures | Validate JWTs, signed cookies, serialised objects |
| A09 | Logging Failures | Never log raw payloads (validated fields only) |
| A10 | SSRF | Validate URLs against allowlist |

## HTTP Status Codes for Validation

| Code | When to use |
|------|-------------|
| 400 Bad Request | Schema failure, type mismatch, missing required field |
| 401 Unauthorized | Invalid or expired token |
| 403 Forbidden | Authenticated but not allowed |
| 404 Not Found | Resource ID doesn't exist (don't leak existence) |
| 405 Method Not Allowed | Wrong HTTP method |
| 406 Not Acceptable | Wrong Accept header |
| 409 Conflict | Resource already exists, stale ETag |
| 410 Gone | Resource existed but is deleted |
| 415 Unsupported Media Type | Wrong Content-Type |
| 422 Unprocessable Content | Business rule violation (correct type, wrong value) |
| 429 Too Many Requests | Rate limit exceeded |

## Required Response Headers on Validation Errors

```
Content-Type: application/json
X-Request-Id: <uuid>            # For tracing
Retry-After: <seconds>          # Only for 429
```

## Characters That MUST Be Rejected in Untrusted Text

```
Null byte       \x00
Line feed       \x0a
Carriage return \x0d
Backspace       \x08
Escape          \x1b
DEL             \x7f
Unicode BOM     \ufeff
```

## Common Attack Payloads for Testing

```
# XSS
<script>alert(1)</script>
<img src=x onerror=alert(1)>
"><svg onload=alert(1)>
javascript:alert(1)

# SQL Injection
' OR '1'='1
' UNION SELECT * FROM users --
1; DROP TABLE users --
admin' --

# NoSQL Injection
{ "$gt": "" }
{ "$ne": "" }
{ "$where": "1" }

# Path Traversal
../../../etc/passwd
..\..\..\windows\win.ini
....//....//....//etc/passwd

# Command Injection
; rm -rf /
| id
`ls -la`
$(cat /etc/passwd)

# SSRF
http://169.254.169.254/latest/meta-data/
http://127.0.0.1:3000/
http://[::1]:5432/

# Prototype Pollution
__proto__.isAdmin=true
constructor.prototype.isAdmin=true

# Unicode Attacks
%c0%ae%c0%ae/   (overlong UTF-8 path traversal)
⒉Ⅴ⒈.com        (homoglyph domain)
```

## Validation Libraries by Stack

| Stack | Library |
|-------|---------|
| TypeScript / Node.js | **Zod** (recommended), Valibot, Joi, Yup |
| Python | **Pydantic v2** (recommended), Marshmallow, attrs+cattrs |
| Go | **go-playground/validator** (recommended), ozzo-validation |
| Java | **Jakarta Validation** (`@Valid`), Hibernate Validator |
| Ruby | **ActiveRecord validations** + Strong Parameters |
| PHP / Laravel | **Form Request** validation rules |
| Rust | **validator** crate, garde |
| .NET | **Data Annotations** (`[Required]`, `[EmailAddress]`), FluentValidation |
| Deno | **Zod** (npm: or deno.land/x), Valibot |
| Swift | **Vapor** `Validation` package |

## Output Encoding Quick Reference

| Context | Method | Example |
|---------|--------|---------|
| HTML body | Entity encode | `& < > " '` → `&amp; &lt; &gt; &quot; &#x27;` |
| HTML attribute | Entity encode + quote | Attribute values in double quotes |
| JavaScript string | `\x` + `\u` escape | `'` → `\x27`, `<` → `\x3c`, `\` → `\\\\` |
| JSON | `JSON.stringify()` | Handles all escaping |
| URL parameter | `encodeURIComponent()` | `?q=` + encodeURIComponent(value) |
| CSS string | `\XX` escape | `\27` for quote, `\5c` for backslash |
| SQL | Parameterised query | NEVER concatenate |
| CSV | Prefix `=+-@` with tab | Prevents formula injection |
| XML | Entity encode + CDATA | Same as HTML for text nodes |

## Quick Decision Flow

```
Input arrives
  ↓
Content-Type valid?  ─NO→ 415
  ↓ YES
Schema parse          ─FAIL→ 400 with field errors
  ↓ PASS
Business rules        ─FAIL→ 422
  ↓ PASS
Auth check            ─FAIL→ 401 / 403
  ↓ PASS
Rate limit            ─FAIL→ 429
  ↓ PASS
Process (parameterised queries)
  ↓
Output encode
  ↓
Return response
```
