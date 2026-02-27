# HTTP Client

Vio ships a lightweight `HttpClient` class built on the native `fetch` API. It provides typed responses, default headers, base URL prefixing, and request/response interceptors.

## Creating an HttpClient

```typescript
import { HttpClient } from 'vio'

const client = new HttpClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer my-token'
  }
})
```

Both options are optional. When `baseURL` is set, all request URLs are prefixed with it. Default `headers` are merged into every request.

```typescript
// Minimal client with no defaults
const client = new HttpClient()
```

## HTTP Methods

The client exposes four methods, each returning a `Promise<HttpResponse<T>>`:

### GET

```typescript
const res = await client.get<User[]>('/users')
console.log(res.data) // User[]
```

### POST

```typescript
const res = await client.post<User>('/users', {
  name: 'Alice',
  email: 'alice@example.com'
})
console.log(res.data) // User
```

### PUT

```typescript
const res = await client.put<User>('/users/1', {
  name: 'Alice Updated'
})
```

### DELETE

```typescript
const res = await client.delete('/users/1')
console.log(res.status) // 200
```

All methods accept an optional `headers` parameter as the last argument to set per-request headers:

```typescript
const res = await client.get<User>('/me', {
  'X-Custom-Header': 'value'
})
```

## Response Shape

Every method returns an `HttpResponse<T>` object:

```typescript
interface HttpResponse<T = unknown> {
  data: T        // Parsed response body (JSON or text)
  status: number // HTTP status code
  headers: Headers // Native Headers object
}
```

The client automatically parses the response body as JSON when the `content-type` header includes `application/json`. Otherwise the body is returned as a string.

## Request Interceptors

Request interceptors let you modify the outgoing request configuration before it is sent. Each interceptor receives a `RequestConfig` and must return a (possibly modified) `RequestConfig`.

```typescript
interface RequestConfig {
  method: string
  headers: Record<string, string>
  body?: string
}
```

Register an interceptor with `client.interceptors.request.use()`:

```typescript
client.interceptors.request.use((config) => {
  // Add a timestamp header to every request
  config.headers['X-Request-Time'] = Date.now().toString()
  return config
})
```

Multiple interceptors run in the order they are registered:

```typescript
// First: add auth
client.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer ${getToken()}`
  return config
})

// Second: add tracing
client.interceptors.request.use((config) => {
  config.headers['X-Trace-Id'] = crypto.randomUUID()
  return config
})
```

## Response Interceptors

Response interceptors transform the response after it is received. Each interceptor receives an `HttpResponse` and must return an `HttpResponse`.

```typescript
client.interceptors.response.use((response) => {
  // Log every response
  console.log(`[${response.status}]`, response.data)
  return response
})
```

A common pattern is unwrapping an API envelope:

```typescript
client.interceptors.response.use((response) => {
  // If the API wraps data in { result: ... }, unwrap it
  if (response.data && typeof response.data === 'object' && 'result' in response.data) {
    response.data = (response.data as any).result
  }
  return response
})
```

## Usage in Components

A typical pattern is fetching data inside the `onMount` lifecycle hook:

```typescript
import { HttpClient } from 'vio'

const api = new HttpClient({ baseURL: 'https://api.example.com' })

const UserList = {
  name: 'UserList',
  state: { users: [], loading: true, error: null },

  onMount(ctx) {
    api.get('/users')
      .then(res => {
        ctx.setState({ users: res.data, loading: false })
      })
      .catch(err => {
        ctx.setState({ error: err.message, loading: false })
      })
  },

  render(state) {
    if (state.loading) {
      return { tag: 'p', children: ['Loading...'] }
    }
    if (state.error) {
      return { tag: 'p', props: { class: 'error' }, children: [state.error] }
    }
    return {
      tag: 'ul',
      children: state.users.map((user) => ({
        tag: 'li',
        key: user.id,
        children: [user.name]
      }))
    }
  }
}
```

## Error Handling

The client throws an `Error` when the response status is not OK (i.e., outside the 2xx range):

```typescript
// The error message includes the status code and status text
// e.g., "HTTP 404: Not Found"
```

Use `try/catch` to handle errors:

```typescript
try {
  const res = await client.get('/users/999')
} catch (err) {
  if (err.message.startsWith('HTTP 404')) {
    console.log('User not found')
  } else {
    console.error('Request failed:', err.message)
  }
}
```

:::warning
Errors are thrown **before** response interceptors run. If the server returns a non-2xx status, interceptors are skipped and the promise rejects immediately.
:::

### Retry Pattern

You can build a simple retry helper around the client:

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<HttpResponse<T>>,
  retries = 3
): Promise<HttpResponse<T>> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error('Unreachable')
}

const res = await fetchWithRetry(() => client.get<User[]>('/users'))
```

:::tip
Create a single `HttpClient` instance per API base URL and share it across your application. This keeps headers and interceptors in one place.
:::
