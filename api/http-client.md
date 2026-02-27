# HttpClient

The `HttpClient` class provides a lightweight HTTP client built on the Fetch API. It supports JSON serialization, configurable base URLs, default headers, and request/response interceptors.

## Import

```ts
import { HttpClient } from 'vio'
```

## Signature

```ts
class HttpClient {
  constructor(options?: HttpClientOptions)
  get<T = unknown>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>
  post<T = unknown>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>>
  put<T = unknown>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>>
  delete<T = unknown>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>
  interceptors: {
    request: { use(fn: RequestInterceptor): void }
    response: { use(fn: ResponseInterceptor): void }
  }
}
```

## Constructor

```ts
new HttpClient(options?: HttpClientOptions)
```

### HttpClientOptions

```ts
interface HttpClientOptions {
  baseURL?: string
  headers?: Record<string, string>
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `baseURL` | `string` | `''` | Prefix prepended to all request URLs |
| `headers` | `Record<string, string>` | `{}` | Default headers included in every request |

```ts
const client = new HttpClient({
  baseURL: 'https://api.example.com',
  headers: {
    Authorization: 'Bearer my-token'
  }
})
```

## Response Type

All HTTP methods return a `Promise<HttpResponse<T>>`:

```ts
interface HttpResponse<T = unknown> {
  data: T
  status: number
  headers: Headers
}
```

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T` | Parsed response body. JSON responses are parsed automatically; other content types are returned as strings. |
| `status` | `number` | HTTP status code |
| `headers` | `Headers` | Response headers (standard `Headers` object) |

## Methods

### get(url, headers?)

Sends a GET request.

```ts
get<T = unknown>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | Yes | Request path (appended to `baseURL`) |
| `headers` | `Record<string, string>` | No | Additional headers for this request |

```ts
const { data, status } = await client.get<User[]>('/users')
console.log(data) // User[]
```

### post(url, body?, headers?)

Sends a POST request. The body is JSON-serialized automatically.

```ts
post<T = unknown>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | Yes | Request path |
| `body` | `unknown` | No | Request body (will be `JSON.stringify`-ed) |
| `headers` | `Record<string, string>` | No | Additional headers |

```ts
const { data } = await client.post<User>('/users', {
  name: 'Alice',
  email: 'alice@example.com'
})
```

### put(url, body?, headers?)

Sends a PUT request. The body is JSON-serialized automatically.

```ts
put<T = unknown>(url: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | Yes | Request path |
| `body` | `unknown` | No | Request body |
| `headers` | `Record<string, string>` | No | Additional headers |

```ts
await client.put('/users/42', { name: 'Alice Updated' })
```

### delete(url, headers?)

Sends a DELETE request.

```ts
delete<T = unknown>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | Yes | Request path |
| `headers` | `Record<string, string>` | No | Additional headers |

```ts
await client.delete('/users/42')
```

::: warning Error Handling
All methods throw an `Error` if the response status is not OK (i.e., `response.ok` is `false`). The error message includes the status code and status text: `"HTTP 404: Not Found"`.
:::

## Interceptors

Interceptors allow you to transform requests before they are sent and responses before they are returned.

### Request Interceptors

```ts
type RequestInterceptor = (config: RequestConfig) => RequestConfig

interface RequestConfig {
  method: string
  headers: Record<string, string>
  body?: string
}
```

```ts
client.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = crypto.randomUUID()
  return config
})
```

### Response Interceptors

```ts
type ResponseInterceptor = (response: HttpResponse) => HttpResponse
```

```ts
client.interceptors.response.use((response) => {
  console.log(`Response ${response.status}`)
  return response
})
```

Multiple interceptors are applied in the order they are registered. Each interceptor receives the output of the previous one.

## Request Flow

1. Merge default headers, per-request headers, and set `Content-Type: application/json`
2. JSON-serialize the body (if present)
3. Run all request interceptors in order
4. Send the request via `fetch(baseURL + url, config)`
5. If `response.ok` is `false`, throw an error
6. Parse the response body (JSON if `Content-Type` includes `application/json`, otherwise text)
7. Run all response interceptors in order
8. Return the `HttpResponse`

## Full Example

```ts
import { HttpClient } from 'vio'

interface Todo {
  id: number
  title: string
  completed: boolean
}

const api = new HttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  headers: {
    Accept: 'application/json'
  }
})

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Log all responses
api.interceptors.response.use((response) => {
  console.log(`[HTTP ${response.status}]`, response.data)
  return response
})

// Usage
async function loadTodos() {
  const { data } = await api.get<Todo[]>('/todos')
  return data
}

async function createTodo(title: string) {
  const { data } = await api.post<Todo>('/todos', {
    title,
    completed: false
  })
  return data
}

async function deleteTodo(id: number) {
  await api.delete(`/todos/${id}`)
}
```

## Related

- [HTTP Client guide](/guide/http-client)
- [createApp](./create-app)
