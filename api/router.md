# Router

The `Router` class provides hash-based client-side routing for Vio applications. It matches URL paths against route definitions, supports dynamic parameters, query strings, and route guards.

## Import

```ts
import { Router } from 'vio'
```

::: tip
You typically do not create a `Router` directly. Instead, pass a `routes` array to [`createApp`](./create-app) and use `app.navigate()`. The `Router` class is exported for advanced use cases and testing.
:::

## Signature

```ts
class Router {
  constructor(routes: Route[], bus: EventBus)
  setStoreGetter(getter: () => Record<string, unknown>): void
  resolve(path: string): RouteMatch | null
  navigate(path: string): RouteMatch | null
  getCurrentRoute(): RouteMatch | null
}
```

## Constructor

```ts
new Router(routes: Route[], bus: EventBus)
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `routes` | [`Route[]`](./types#route) | Yes | Array of route definitions |
| `bus` | [`EventBus`](./event-bus) | Yes | Event bus instance for emitting route events |

## Route Interface

```ts
interface Route {
  path: string
  component: ComponentDef
  guard?: (store: Record<string, unknown>) => boolean
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `path` | `string` | Yes | URL path pattern. Supports static segments, dynamic params (`:id`), and wildcard (`*`). |
| `component` | [`ComponentDef`](./types#componentdef) | Yes | Component to render when this route matches |
| `guard` | `(store: Record<string, unknown>) => boolean` | No | Guard function. If it returns `false`, the route is skipped. Receives the current store state. |

### Path Matching

- **Static paths**: `/about`, `/users` -- exact match
- **Dynamic parameters**: `/users/:id` -- captures `:id` as a param
- **Wildcard**: `*` -- matches any path (useful as a catch-all / 404 route)

Routes are matched in order. The first matching route wins.

## RouteMatch Interface

```ts
interface RouteMatch {
  component: ComponentDef
  params: Record<string, string>
  path: string
  query: Record<string, string>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `component` | `ComponentDef` | The matched route's component definition |
| `params` | `Record<string, string>` | Dynamic path parameters (e.g., `{ id: '42' }`) |
| `path` | `string` | The matched pathname (without query string) |
| `query` | `Record<string, string>` | Parsed query string parameters |

## Methods

### setStoreGetter(getter)

Sets a function that the router calls to get the current store state when evaluating route guards.

```ts
setStoreGetter(getter: () => Record<string, unknown>): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `getter` | `() => Record<string, unknown>` | Function returning the current store state |

::: tip
This is called automatically by `createApp` when both a store and routes are configured.
:::

### resolve(path)

Resolves a path against the route definitions without triggering navigation or emitting events. Returns the matching `RouteMatch` or `null`.

```ts
resolve(path: string): RouteMatch | null
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Path to resolve, optionally with a query string (e.g., `/users/42?tab=posts`) |

```ts
const match = router.resolve('/users/42?tab=posts')
if (match) {
  console.log(match.params)  // { id: '42' }
  console.log(match.query)   // { tab: 'posts' }
}
```

### navigate(path)

Navigates to a path. Updates the current route and emits route lifecycle events. Returns the matching `RouteMatch` or `null` if no route matched.

```ts
navigate(path: string): RouteMatch | null
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Path to navigate to |

```ts
const match = router.navigate('/about')
```

### getCurrentRoute()

Returns the current `RouteMatch` or `null` if no navigation has occurred.

```ts
getCurrentRoute(): RouteMatch | null
```

```ts
const current = router.getCurrentRoute()
if (current) {
  console.log('Currently at:', current.path)
}
```

## Events Emitted

The router emits three events during navigation (in order):

| Event | Payload | Description |
|-------|---------|-------------|
| `route:before` | `{ from: string \| null, to: string }` | Before the route change is applied |
| `route:change` | `{ from: string \| null, to: string, params: Record<string, string> }` | After the current route is updated |
| `route:after` | `{ path: string, params: Record<string, string> }` | After navigation is complete |

## Full Example

```ts
import { createApp, defineComponent } from 'vio'

const Home = defineComponent({
  name: 'Home',
  render: () => ({ tag: 'h1', children: ['Home'] })
})

const UserProfile = defineComponent({
  name: 'UserProfile',
  render: (state) => ({
    tag: 'div',
    children: [
      { tag: 'h1', children: [`User ${state.userId}`] }
    ]
  })
})

const NotFound = defineComponent({
  name: 'NotFound',
  render: () => ({ tag: 'h1', children: ['404 - Not Found'] })
})

const Dashboard = defineComponent({
  name: 'Dashboard',
  render: () => ({ tag: 'h1', children: ['Dashboard'] })
})

const app = createApp({
  root: '#app',
  routes: [
    { path: '/', component: Home },
    { path: '/users/:id', component: UserProfile },
    {
      path: '/dashboard',
      component: Dashboard,
      guard: (store) => store.isAuthenticated === true
    },
    { path: '*', component: NotFound }
  ],
  store: {
    state: { isAuthenticated: false },
    actions: {
      login: (state) => ({ ...state, isAuthenticated: true }),
      logout: (state) => ({ ...state, isAuthenticated: false })
    }
  }
})

app.on('route:change', (e) => {
  console.log(`Navigated from ${e.payload.from} to ${e.payload.to}`)
})

app.mount()
```

## Related

- [Route type](./types#route)
- [RouteMatch type](./types#routematch)
- [Routing guide](/guide/routing)
- [createApp](./create-app)
- [EventBus](./event-bus)
