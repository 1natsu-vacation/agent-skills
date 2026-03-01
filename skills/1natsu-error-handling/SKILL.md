---
name: 1natsu-error-handling
description: Use when implementing error handling, writing try-catch blocks, designing error handling layers, or reviewing code for proper error propagation. Provides language-aware guidelines for structured error handling.
license: MIT
metadata:
  author: 1natsu
  version: "1.0.0"
---

# Error Handling Guidelines

Structured error handling patterns to prevent silent failures and ensure proper error propagation.

## When to Use

- Implementing error handling in any language
- Writing or reviewing try-catch / try-except blocks
- Designing error handling layers or middleware
- Reviewing code for swallowed errors or missing error handling

## Principles

### Never swallow errors

Errors must be either handled meaningfully or propagated to the caller. Empty catch blocks are forbidden.

### Handle at boundaries, not at endpoints

Endpoint functions (business logic, utilities) should throw/raise errors. Catch them at **architectural boundaries** — API handlers, UI layers, job runners, middleware — where they can be handled structurally.

### Separate concerns by layer

- **Domain layer**: throw domain-specific errors
- **Infrastructure layer**: translate infrastructure errors into domain errors
- **Presentation layer**: convert errors into user-facing responses

### Catch at the right granularity

Avoid wrapping large blocks in a single try. Keep try blocks small so the error source is obvious.

### Use custom error types

Distinguish error kinds via types/classes so handlers can branch appropriately.

### Don't conflate logging with handling

Logging is observability. Handling is action (retry, fallback, user notification). Do both at the boundary handler — don't `console.log` and re-throw at every layer.

### Guarantee resource cleanup

Use `finally` / `defer` / `with` / `using` to prevent resource leaks on error paths.

## JavaScript / TypeScript

### Strategy

- **Endpoint functions**: detect errors and `throw`. Do not catch.
- **Middleware / boundaries**: catch errors structurally in a centralized handler.
- **Async code**: always handle `async/await` errors upstream with `try-catch` or `.catch()`.

### Anti-patterns

```typescript
// BAD: empty catch — swallows the error
try {
  await fetchData();
} catch (e) {}

// BAD: console.log only — no actual handling
try {
  await fetchData();
} catch (e) {
  console.log(e);
}

// BAD: catch at endpoint with default return — caller can't distinguish DB error from missing data
async function getUser(id: string) {
  try {
    return await db.users.findById(id);
  } catch {
    return null;
  }
}
```

### Recommended patterns

```typescript
// GOOD: throw at endpoint, let errors propagate
async function getUser(id: string): Promise<User> {
  const user = await db.users.findById(id); // DB errors propagate naturally
  if (!user) {
    throw new NotFoundError(`User not found: ${id}`);
  }
  return user;
}

// GOOD: centralized handler at the boundary
app.use((err, req, res, next) => {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  logger.error(err);
  return res.status(500).json({ error: "Internal Server Error" });
});
```
